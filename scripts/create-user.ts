// Creates a sign-in account, or resets its password if the email already exists.
//
//   npm run user:create -- --email you@example.com --role admin [--remote]
//   npm run user:create -- --email you@example.com --role practitioner --practitioner dr-ali [--remote]
//   npm run user:create -- --email you@example.com --role admin --remote --env staging
//   npm run user:create -- --email you@example.com --reset-2fa [--remote]    (turns off two-step sign-in for any account; nothing else changes)
//
// A strong password is generated and appended to credentials.local.txt (git-ignored),
// never printed, so it doesn't end up in terminal logs or chat transcripts.
import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { hashPassword } from "../src/lib/password.ts";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    role: { type: "string" },
    practitioner: { type: "string" },
    name: { type: "string" },
    remote: { type: "boolean", default: false },
    "reset-2fa": { type: "boolean", default: false },
    env: { type: "string" }, // e.g. "staging" — targets that environment's own D1 database.
  },
});

const database = values.env ? `mentifylabs-${values.env}-db` : "mentifylabs-db";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const email = values.email?.trim().toLowerCase();
const role = values.role;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Pass a valid --email.");

// Recovery for anyone who can't receive the emailed code (mail is down, or they lost the mailbox).
if (values["reset-2fa"]) {
  const reset = `
UPDATE users SET two_factor_enabled_at = NULL WHERE email = ${email ? `'${email.replace(/'/g, "''")}'` : "''"};
DELETE FROM login_codes WHERE user_id IN (SELECT id FROM users WHERE email = ${email ? `'${email.replace(/'/g, "''")}'` : "''"});
`;
  const dir = mkdtempSync(join(tmpdir(), "mentifylabs-2fa-"));
  const file = join(dir, "reset.sql");
  writeFileSync(file, reset);
  const done = spawnSync("npx", ["wrangler", "d1", "execute", database, values.remote ? "--remote" : "--local", "--file", file], {
    shell: true,
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
  });
  rmSync(dir, { recursive: true, force: true });
  if (done.status !== 0) fail(`Could not turn off two-step sign-in:
${`${done.stdout}
${done.stderr}`.slice(-1500)}`);
  console.log(`Two-step sign-in is now off for ${email}. They can sign in with their password and turn it back on in Settings.`);
  process.exit(0);
}

if (role !== "admin" && role !== "practitioner") fail("Pass --role admin or --role practitioner.");
if (role === "practitioner" && !values.practitioner) fail("Pass --practitioner <slug> for a practitioner account.");

const sql = (v: string) => `'${v.replace(/'/g, "''")}'`;

const bytes = crypto.getRandomValues(new Uint8Array(15));
const password = Buffer.from(bytes).toString("base64url");
const hash = await hashPassword(password);

const practitionerId =
  role === "practitioner" ? `(SELECT id FROM practitioners WHERE slug = ${sql(values.practitioner!)})` : "NULL";
const name = values.name
  ? sql(values.name)
  : role === "practitioner"
    ? `COALESCE((SELECT full_name FROM practitioners WHERE slug = ${sql(values.practitioner!)}), '')`
    : "'Super Admin'";

const statement = `
INSERT INTO users (email, name, password_hash, role, practitioner_id, email_verified_at)
VALUES (${sql(email)}, ${name}, ${sql(hash)}, ${sql(role)}, ${practitionerId}, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT (email) DO UPDATE SET
  email_verified_at = COALESCE(users.email_verified_at, excluded.email_verified_at),
  password_hash = excluded.password_hash,
  role = excluded.role,
  practitioner_id = excluded.practitioner_id;
DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = ${sql(email)});
DELETE FROM login_attempts WHERE email = ${sql(email)} OR (email >= ${sql(email + "|")} AND email < ${sql(email + "}")});
`;

const dir = mkdtempSync(join(tmpdir(), "mentifylabs-user-"));
const file = join(dir, "user.sql");
writeFileSync(file, statement);
const target = values.remote ? "--remote" : "--local";
const result = spawnSync("npx", ["wrangler", "d1", "execute", database, target, "--file", file], {
  shell: true,
  encoding: "utf8",
  env: { ...process.env, CI: "1" },
});
rmSync(dir, { recursive: true, force: true });

if (result.status !== 0) {
  const output = `${result.stdout}\n${result.stderr}`;
  if (output.includes("CHECK constraint failed")) fail(`No practitioner with slug "${values.practitioner}".`);
  fail(`Could not save the account:\n${output.slice(-1500)}`);
}

const where = values.env ? values.env : values.remote ? "production" : "local";
appendFileSync(
  "credentials.local.txt",
  `${new Date().toISOString()}  ${where.padEnd(10)}  ${role.padEnd(12)}  ${email}  ${password}\n`,
);
console.log(`Saved the ${where} ${role} account ${email}. Its password is in credentials.local.txt.`);
