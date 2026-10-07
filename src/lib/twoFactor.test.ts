import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Outside a web request there are no cookies, no headers and no mail provider. They are replaced by a cookie jar the
// tests can inspect, a network address per test, and an inbox, so the real code runs against the real local database.
const jar = new Map<string, string>();
let nextIp = 0;
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "cf-connecting-ip": `twofactor-test-${nextIp}`, host: "localhost:3000" }),
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (arg: string | { name: string }) => void jar.delete(typeof arg === "string" ? arg : arg.name),
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
const inbox: { to: string; subject: string; code?: string }[] = [];
let mailWorks = true;
vi.mock("@/lib/notifications", () => ({
  sendBrandedEmail: async (m: { to: string; subject: string; content: { note?: { text: string } } }) => {
    if (!mailWorks) return false;
    inbox.push({ to: m.to, subject: m.subject, code: m.content.note?.text });
    return true;
  },
}));

import { randomBytes } from "node:crypto";
import { first, run } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { resetPassword } from "@/lib/passwordReset";
import { sha256Hex, signIn, type SessionUser } from "@/lib/session";
import {
  beginLoginChallenge,
  completeLoginChallenge,
  disableTwoFactor,
  enableTwoFactor,
  getLoginChallenge,
  requestDisableCode,
  requestEnableCode,
  resendLoginCode,
} from "@/lib/twoFactor";

const PASSWORD = "Correct-horse-9";
const madeUsers: string[] = [];
const madePractitioners: string[] = [];

async function makeUser(opts: { twoFactor?: boolean; role?: "admin" | "practitioner" } = {}) {
  const role = opts.role ?? "admin";
  const email = `tf${randomBytes(5).toString("hex")}@example.com`;
  let practitionerId: string | null = null;
  if (role === "practitioner") {
    const slug = `tf-${randomBytes(5).toString("hex")}`;
    const p = await first<{ id: string }>(
      "INSERT INTO practitioners (slug, full_name, email, status, fee_currency) VALUES (?, 'TF Tester', ?, 'active', 'PKR') RETURNING id",
      slug,
      email,
    );
    practitionerId = p!.id;
    madePractitioners.push(slug);
  }
  const user = await first<{ id: string }>(
    `INSERT INTO users (email, name, password_hash, role, practitioner_id, email_verified_at, two_factor_enabled_at)
     VALUES (?, 'Test Admin', ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ?) RETURNING id`,
    email,
    await hashPassword(PASSWORD),
    role,
    practitionerId,
    opts.twoFactor ? new Date().toISOString() : null,
  );
  madeUsers.push(user!.id);
  const session: SessionUser = { id: user!.id, email, name: "Test Admin", phone: "", role, practitionerId };
  return { id: user!.id, email, session };
}

const sessions = async (userId: string) => (await first<{ n: number }>("SELECT count(*) AS n FROM sessions WHERE user_id = ?", userId))?.n ?? 0;
const lastCode = (to: string) => [...inbox].reverse().find((m) => m.to === to)?.code ?? "";
const flagOn = async (userId: string) => !!(await first("SELECT 1 FROM users WHERE id = ? AND two_factor_enabled_at IS NOT NULL", userId));
/** Lets the resend cooldown pass without waiting a real minute. */
const ageCodes = (userId: string) => run("UPDATE login_codes SET created_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 minutes') WHERE user_id = ?", userId);
const wrongCode = (right: string) => (right === "000000" ? "111111" : "000000");

beforeEach(() => {
  nextIp += 1;
  jar.clear();
  inbox.length = 0;
  mailWorks = true;
});

afterEach(async () => {
  for (const id of madeUsers.splice(0)) await run("DELETE FROM users WHERE id = ?", id);
  for (const slug of madePractitioners.splice(0)) await run("DELETE FROM practitioners WHERE slug = ?", slug);
  await run("DELETE FROM login_attempts WHERE email LIKE 'otp:%' OR email LIKE '2fa-off:%' OR email LIKE 'ip:twofactor-test-%' OR email LIKE '%tf%@example.com%'");
});

describe("the password step", () => {
  it("starts no session for a Super Admin with two-step sign-in, and says a code is needed", async () => {
    const u = await makeUser({ twoFactor: true });
    expect(await signIn(u.email, PASSWORD)).toMatchObject({ ok: true, twoFactor: true, userId: u.id });
    expect(await sessions(u.id)).toBe(0);
  });

  it("signs in as before when two-step sign-in is off, and for practitioners", async () => {
    const admin = await makeUser();
    expect(await signIn(admin.email, PASSWORD)).toMatchObject({ ok: true });
    expect(await sessions(admin.id)).toBe(1);

    const practitioner = await makeUser({ role: "practitioner" });
    const result = await signIn(practitioner.email, PASSWORD);
    expect(result).toMatchObject({ ok: true });
    expect(result.ok && result.twoFactor).toBeFalsy();
  });
});

describe("finishing a sign-in with the emailed code", () => {
  it("emails a 6-digit code, and the right code starts the session", async () => {
    const u = await makeUser({ twoFactor: true });
    expect(await beginLoginChallenge(u.id)).toEqual({ ok: true });
    const code = lastCode(u.email);
    expect(code).toMatch(/^\d{6}$/);
    expect(await getLoginChallenge()).toMatchObject({ maskedEmail: expect.stringContaining("@example.com") });

    expect(await completeLoginChallenge(code)).toEqual({ ok: true, role: "admin" });
    expect(await sessions(u.id)).toBe(1);
    expect(jar.has("ml_2fa")).toBe(false);
  });

  it("works once: the same code can't be used a second time", async () => {
    const u = await makeUser({ twoFactor: true });
    await beginLoginChallenge(u.id);
    const code = lastCode(u.email);
    const challengeCookie = jar.get("ml_2fa")!;
    expect(await completeLoginChallenge(code)).toMatchObject({ ok: true });

    jar.set("ml_2fa", challengeCookie); // someone replaying the same cookie and code
    expect(await completeLoginChallenge(code)).toMatchObject({ ok: false, dead: true });
    expect(await sessions(u.id)).toBe(1);
  });

  it("refuses a wrong code, and burns the code after five wrong guesses even if the right one follows", async () => {
    const u = await makeUser({ twoFactor: true });
    await beginLoginChallenge(u.id);
    const code = lastCode(u.email);

    for (let i = 0; i < 4; i++) expect(await completeLoginChallenge(wrongCode(code))).toMatchObject({ ok: false, message: "That code isn't right." });
    expect(await completeLoginChallenge(wrongCode(code))).toMatchObject({ ok: false, dead: true });
    expect(await completeLoginChallenge(code)).toMatchObject({ ok: false, dead: true });
    expect(await sessions(u.id)).toBe(0);
  });

  it("is tied to the browser that asked: the code alone, from anywhere else, does nothing", async () => {
    const u = await makeUser({ twoFactor: true });
    await beginLoginChallenge(u.id);
    const code = lastCode(u.email);

    jar.clear(); // a different browser: no challenge cookie
    expect(await completeLoginChallenge(code)).toMatchObject({ ok: false, dead: true });
    expect(await sessions(u.id)).toBe(0);
  });

  it("refuses an expired code", async () => {
    const u = await makeUser({ twoFactor: true });
    await beginLoginChallenge(u.id);
    const code = lastCode(u.email);
    await run("UPDATE login_codes SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 minutes') WHERE user_id = ?", u.id);

    expect(await completeLoginChallenge(code)).toMatchObject({ ok: false, dead: true });
    expect(await sessions(u.id)).toBe(0);
  });

  it("insists on six digits and ignores spaces", async () => {
    const u = await makeUser({ twoFactor: true });
    await beginLoginChallenge(u.id);
    const code = lastCode(u.email);
    expect(await completeLoginChallenge("12ab")).toMatchObject({ ok: false, message: expect.stringMatching(/6-digit/) });
    expect(await completeLoginChallenge(`${code.slice(0, 3)} ${code.slice(3)}`)).toMatchObject({ ok: true });
  });

  it("won't sign in an account that was suspended while the code was in the inbox", async () => {
    const u = await makeUser({ twoFactor: true });
    await beginLoginChallenge(u.id);
    const code = lastCode(u.email);
    await run("UPDATE users SET email_verified_at = NULL WHERE id = ?", u.id); // no longer allowed to sign in

    expect(await completeLoginChallenge(code)).toMatchObject({ ok: false });
    expect(await sessions(u.id)).toBe(0);
  });

  it("resending waits a minute, and then the old code stops working", async () => {
    const u = await makeUser({ twoFactor: true });
    await beginLoginChallenge(u.id);
    const first = lastCode(u.email);

    expect(await resendLoginCode()).toMatchObject({ ok: false, message: expect.stringMatching(/wait a minute/i) });
    await ageCodes(u.id);
    expect(await resendLoginCode()).toEqual({ ok: true });
    const second = lastCode(u.email);

    if (second !== first) expect(await completeLoginChallenge(first)).toMatchObject({ ok: false });
    expect(await completeLoginChallenge(second)).toMatchObject({ ok: true });
  });

  it("starts nothing and says so when the email can't be sent in production", async () => {
    const u = await makeUser({ twoFactor: true });
    const before = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    mailWorks = false;
    try {
      expect(await beginLoginChallenge(u.id)).toMatchObject({ ok: false, message: expect.stringMatching(/couldn't send/i) });
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = before;
    }
    expect(jar.has("ml_2fa")).toBe(false);
    expect((await first<{ n: number }>("SELECT count(*) AS n FROM login_codes WHERE user_id = ?", u.id))?.n).toBe(0);
  });
});

describe("turning it on", () => {
  it("needs the emailed code, then switches on and signs out the other devices", async () => {
    const u = await makeUser();
    const mine = "this-browsers-session-token";
    await run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", await sha256Hex(mine), u.id, new Date(Date.now() + 86_400_000).toISOString());
    await run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", "other-device", u.id, new Date(Date.now() + 86_400_000).toISOString());
    jar.set("ml_session", mine);

    expect(await requestEnableCode(u.session)).toEqual({ ok: true });
    expect(await enableTwoFactor(u.session, wrongCode(lastCode(u.email)))).toMatchObject({ ok: false });
    expect(await flagOn(u.id)).toBe(false);

    expect(await enableTwoFactor(u.session, lastCode(u.email))).toEqual({ ok: true });
    expect(await flagOn(u.id)).toBe(true);
    expect(await sessions(u.id)).toBe(1); // only this browser's
  });

  it("can't be turned on twice", async () => {
    const u = await makeUser({ twoFactor: true });
    expect(await requestEnableCode(u.session)).toMatchObject({ ok: false, message: expect.stringMatching(/already on/i) });
  });

  it("a code for signing in can't be used to turn it on or off", async () => {
    const u = await makeUser({ twoFactor: true });
    await beginLoginChallenge(u.id);
    expect(await enableTwoFactor(u.session, lastCode(u.email))).toMatchObject({ ok: false });
    expect(await disableTwoFactor(u.session, PASSWORD, lastCode(u.email))).toMatchObject({ ok: false });
    expect(await flagOn(u.id)).toBe(true);
  });
});

describe("turning it off", () => {
  it("needs the password and a fresh emailed code", async () => {
    const u = await makeUser({ twoFactor: true });
    expect(await requestDisableCode(u.session)).toEqual({ ok: true });
    const code = lastCode(u.email);

    expect(await disableTwoFactor(u.session, "not-the-password", code)).toMatchObject({ ok: false, message: "Your password isn't right." });
    expect(await disableTwoFactor(u.session, PASSWORD, wrongCode(code))).toMatchObject({ ok: false });
    expect(await flagOn(u.id)).toBe(true);

    expect(await disableTwoFactor(u.session, PASSWORD, code)).toEqual({ ok: true });
    expect(await flagOn(u.id)).toBe(false);
  });

  it("limits password guesses", async () => {
    const u = await makeUser({ twoFactor: true });
    await requestDisableCode(u.session);
    for (let i = 0; i < 5; i++) await disableTwoFactor(u.session, "wrong", lastCode(u.email));
    expect(await disableTwoFactor(u.session, PASSWORD, lastCode(u.email))).toMatchObject({ ok: false, message: expect.stringMatching(/too many attempts/i) });
    expect(await flagOn(u.id)).toBe(true);
  });
});

describe("a link can't walk past the code", () => {
  async function resetLinkFor(userId: string) {
    const token = randomBytes(16).toString("hex");
    await run("INSERT INTO password_resets (id, user_id, expires_at) VALUES (?, ?, ?)", await sha256Hex(token), userId, new Date(Date.now() + 3_600_000).toISOString());
    return token;
  }

  it("a Super Admin with two-step sign-in is not signed in by a password-reset link", async () => {
    const u = await makeUser({ twoFactor: true });
    const result = await resetPassword(await resetLinkFor(u.id), "A-brand-new-password-1");
    expect(result).toEqual({ ok: true, home: "/login" });
    expect(await sessions(u.id)).toBe(0);
    // The new password works, and still stops at the code.
    expect(await signIn(u.email, "A-brand-new-password-1")).toMatchObject({ ok: true, twoFactor: true });
  });

  it("without two-step sign-in a reset link still signs them in", async () => {
    const u = await makeUser();
    expect(await resetPassword(await resetLinkFor(u.id), "A-brand-new-password-1")).toEqual({ ok: true, home: "/admin" });
    expect(await sessions(u.id)).toBe(1);
  });
});

describe("practitioners get the same protection", () => {
  it("a practitioner with two-step sign-in stops at the code, then signs in to their own portal", async () => {
    const u = await makeUser({ role: "practitioner", twoFactor: true });
    expect(await signIn(u.email, PASSWORD)).toMatchObject({ ok: true, role: "practitioner", twoFactor: true });
    expect(await sessions(u.id)).toBe(0);

    expect(await beginLoginChallenge(u.id)).toEqual({ ok: true });
    expect(await completeLoginChallenge(lastCode(u.email))).toEqual({ ok: true, role: "practitioner" });
    expect(await sessions(u.id)).toBe(1);
  });

  it("records the last sign-in only once someone is really in, whichever way they signed in", async () => {
    const lastSignIn = async (email: string) =>
      (await first<{ last_sign_in: string | null }>("SELECT last_sign_in FROM practitioners WHERE email = ?", email))?.last_sign_in ?? null;

    const withCode = await makeUser({ role: "practitioner", twoFactor: true });
    await signIn(withCode.email, PASSWORD);
    expect(await lastSignIn(withCode.email)).toBeNull(); // the password alone is not a sign-in
    await beginLoginChallenge(withCode.id);
    const before = Date.now();
    await completeLoginChallenge(lastCode(withCode.email));
    expect(Date.parse((await lastSignIn(withCode.email))!)).toBeGreaterThanOrEqual(before - 1000);

    const plain = await makeUser({ role: "practitioner" });
    await signIn(plain.email, PASSWORD);
    expect(await lastSignIn(plain.email)).not.toBeNull();
  });

  it("a practitioner without it signs in as before", async () => {
    const u = await makeUser({ role: "practitioner" });
    const result = await signIn(u.email, PASSWORD);
    expect(result).toMatchObject({ ok: true, role: "practitioner" });
    expect(result.ok && result.twoFactor).toBeFalsy();
    expect(await sessions(u.id)).toBe(1);
  });

  it("they can turn it on with the emailed code, and off again with the password and a fresh code", async () => {
    const u = await makeUser({ role: "practitioner" });
    expect(await requestEnableCode(u.session)).toEqual({ ok: true });
    expect(await enableTwoFactor(u.session, lastCode(u.email))).toEqual({ ok: true });
    expect(await flagOn(u.id)).toBe(true);

    expect(await requestDisableCode(u.session)).toEqual({ ok: true });
    expect(await disableTwoFactor(u.session, PASSWORD, lastCode(u.email))).toEqual({ ok: true });
    expect(await flagOn(u.id)).toBe(false);
  });

  it("a reset link, such as one a Super Admin issues, does not sign them in past the code", async () => {
    const u = await makeUser({ role: "practitioner", twoFactor: true });
    const token = randomBytes(16).toString("hex");
    await run("INSERT INTO password_resets (id, user_id, expires_at) VALUES (?, ?, ?)", await sha256Hex(token), u.id, new Date(Date.now() + 3_600_000).toISOString());
    expect(await resetPassword(token, "A-brand-new-password-1")).toEqual({ ok: true, home: "/login" });
    expect(await sessions(u.id)).toBe(0);
  });

  it("a suspended practitioner can't finish a sign-in with a code that was already sent", async () => {
    const u = await makeUser({ role: "practitioner", twoFactor: true });
    await beginLoginChallenge(u.id);
    const code = lastCode(u.email);
    await run("UPDATE practitioners SET status = 'suspended' WHERE id = (SELECT practitioner_id FROM users WHERE id = ?)", u.id);

    expect(await completeLoginChallenge(code)).toMatchObject({ ok: false });
    expect(await sessions(u.id)).toBe(0);
  });
});
