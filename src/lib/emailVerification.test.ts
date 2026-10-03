import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// These functions run inside web requests. Outside one there are no headers, no cookie jar and no mail provider,
// so those are replaced: each test gets its own network address, sessions go nowhere, and every email is captured
// so the confirmation link inside it can be used.
let nextIp = 0;
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "cf-connecting-ip": `emailverify-test-${nextIp}`, host: "localhost:3000" }),
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
const sent: { to: string; subject: string; url?: string }[] = [];
vi.mock("@/lib/notifications", () => ({
  sendBrandedEmail: async (m: { to: string; subject: string; content: { button?: { url: string } } }) => {
    sent.push({ to: m.to, subject: m.subject, url: m.content.button?.url });
    return true;
  },
}));

import { randomBytes } from "node:crypto";
import { first, run } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signIn, updateUserDetails } from "@/lib/session";
import {
  resendConfirmationForEmail,
  sendVerificationEmail,
  verifyEmailToken,
} from "@/lib/emailVerification";
import { requestPasswordReset, resetPassword } from "@/lib/passwordReset";

const PASSWORD = "Correct-horse-9";
const made: { users: string[]; practitioners: string[] } = { users: [], practitioners: [] };

const unique = () => `evtest${randomBytes(5).toString("hex")}@example.com`;
const tokenFrom = (url?: string) => new URL(url!).searchParams.get("token")!;
const lastLinkFor = (to: string) => [...sent].reverse().find((m) => m.to === to)?.url;

/** A practitioner-role account (with its profile) or an admin, confirmed or not. */
async function makeUser(opts: { verified: boolean; role?: "practitioner" | "admin" }) {
  const email = unique();
  const role = opts.role ?? "practitioner";
  let practitionerId: string | null = null;
  if (role === "practitioner") {
    const slug = `evt-${randomBytes(5).toString("hex")}`;
    const p = await first<{ id: string }>(
      "INSERT INTO practitioners (slug, full_name, email, status) VALUES (?, 'Verify Tester', ?, 'active') RETURNING id",
      slug,
      email,
    );
    practitionerId = p!.id;
    made.practitioners.push(slug);
  }
  const user = await first<{ id: string }>(
    `INSERT INTO users (email, name, password_hash, role, practitioner_id, email_verified_at)
     VALUES (?, 'Verify Tester', ?, ?, ?, ?) RETURNING id`,
    email,
    await hashPassword(PASSWORD),
    role,
    practitionerId,
    opts.verified ? new Date().toISOString() : null,
  );
  made.users.push(user!.id);
  return { id: user!.id, email, practitionerId };
}

const sessionCount = async (userId: string) =>
  (await first<{ n: number }>("SELECT count(*) AS n FROM sessions WHERE user_id = ?", userId))?.n ?? 0;
const userRow = (id: string) =>
  first<{ email: string; pending_email: string | null; email_verified_at: string | null }>(
    "SELECT email, pending_email, email_verified_at FROM users WHERE id = ?",
    id,
  );

beforeEach(() => {
  nextIp += 1;
  sent.length = 0;
});

afterEach(async () => {
  for (const id of made.users.splice(0)) await run("DELETE FROM users WHERE id = ?", id);
  for (const slug of made.practitioners.splice(0)) await run("DELETE FROM practitioners WHERE slug = ?", slug);
  await run("DELETE FROM login_attempts WHERE email LIKE '%evtest%' OR email LIKE 'ip:emailverify-test-%' OR email LIKE 'resend:emailverify-test-%'");
});

describe("signing in needs a confirmed email", () => {
  it("refuses a correct password when the address isn't confirmed, and starts no session", async () => {
    const u = await makeUser({ verified: false });
    const result = await signIn(u.email, PASSWORD);
    expect(result).toMatchObject({ ok: false, unverified: true });
    expect(await sessionCount(u.id)).toBe(0);
  });

  it("lets a confirmed account in", async () => {
    const u = await makeUser({ verified: true });
    expect(await signIn(u.email, PASSWORD)).toMatchObject({ ok: true, role: "practitioner" });
    expect(await sessionCount(u.id)).toBe(1);
  });

  it("a wrong password still looks like any other wrong password", async () => {
    const u = await makeUser({ verified: false });
    const result = await signIn(u.email, "not-the-password");
    expect(result).toMatchObject({ ok: false });
    expect((result as { unverified?: boolean }).unverified).toBeUndefined();
  });
});

describe("the confirmation link", () => {
  it("confirms the address and then the account can sign in", async () => {
    const u = await makeUser({ verified: false });
    await sendVerificationEmail(u.id, u.email, "Verify Tester");
    const result = await verifyEmailToken(tokenFrom(lastLinkFor(u.email)));

    expect(result).toMatchObject({ ok: true, userId: u.id, changedEmail: false });
    expect((await userRow(u.id))?.email_verified_at).not.toBeNull();
    expect(await signIn(u.email, PASSWORD)).toMatchObject({ ok: true });
  });

  it("works only once", async () => {
    const u = await makeUser({ verified: false });
    await sendVerificationEmail(u.id, u.email, "Verify Tester");
    const token = tokenFrom(lastLinkFor(u.email));
    expect((await verifyEmailToken(token)).ok).toBe(true);
    expect((await verifyEmailToken(token)).ok).toBe(false);
  });

  it("is refused once it has expired", async () => {
    const u = await makeUser({ verified: false });
    await sendVerificationEmail(u.id, u.email, "Verify Tester");
    await run("UPDATE email_verifications SET expires_at = '2000-01-01T00:00:00.000Z' WHERE user_id = ?", u.id);
    expect((await verifyEmailToken(tokenFrom(lastLinkFor(u.email)))).ok).toBe(false);
  });

  it("a new link replaces the old one", async () => {
    const u = await makeUser({ verified: false });
    await sendVerificationEmail(u.id, u.email, "Verify Tester");
    const first = tokenFrom(lastLinkFor(u.email));
    await sendVerificationEmail(u.id, u.email, "Verify Tester");
    expect((await verifyEmailToken(first)).ok).toBe(false);
  });
});

describe("sending the link again", () => {
  it("sends one to an unconfirmed address, but not twice in a minute", async () => {
    const u = await makeUser({ verified: false });
    await resendConfirmationForEmail(u.email);
    await resendConfirmationForEmail(u.email);
    expect(sent.filter((m) => m.to === u.email)).toHaveLength(1);
  });

  it("says nothing and sends nothing for an unknown or already confirmed address", async () => {
    const confirmed = await makeUser({ verified: true });
    await resendConfirmationForEmail("nobody-here@example.com");
    await resendConfirmationForEmail(confirmed.email);
    expect(sent).toHaveLength(0);
  });
});

describe("changing the email address", () => {
  it("waits for confirmation: the sign-in address doesn't change until the new one is confirmed", async () => {
    const u = await makeUser({ verified: true });
    const next = unique();
    const result = await updateUserDetails({ id: u.id, email: u.email, name: "Verify Tester", phone: "", role: "practitioner", practitionerId: u.practitionerId }, { name: "Verify Tester", email: next, phone: "" });
    expect(result).toMatchObject({ ok: true, pendingEmail: next });

    expect(await userRow(u.id)).toMatchObject({ email: u.email, pending_email: next });
    // still signs in with the old address, and not yet with the new one
    expect(await signIn(u.email, PASSWORD)).toMatchObject({ ok: true });
    expect((await signIn(next, PASSWORD)).ok).toBe(false);
  });

  it("swaps the sign-in and practitioner email when the new address is confirmed", async () => {
    const u = await makeUser({ verified: true });
    const next = unique();
    await updateUserDetails({ id: u.id, email: u.email, name: "Verify Tester", phone: "", role: "practitioner", practitionerId: u.practitionerId }, { name: "Verify Tester", email: next, phone: "" });
    await sendVerificationEmail(u.id, next, "Verify Tester", { newEmail: next });

    const result = await verifyEmailToken(tokenFrom(lastLinkFor(next)));
    expect(result).toMatchObject({ ok: true, changedEmail: true });
    expect(await userRow(u.id)).toMatchObject({ email: next, pending_email: null });
    expect((await first<{ email: string }>("SELECT email FROM practitioners WHERE id = ?", u.practitionerId))?.email).toBe(next);
    expect((await signIn(u.email, PASSWORD)).ok).toBe(false);
    expect(await signIn(next, PASSWORD)).toMatchObject({ ok: true });
  });

  it("refuses to take an address another account has claimed in the meantime", async () => {
    const u = await makeUser({ verified: true });
    const other = await makeUser({ verified: true });
    const next = unique();
    await updateUserDetails({ id: u.id, email: u.email, name: "Verify Tester", phone: "", role: "practitioner", practitionerId: u.practitionerId }, { name: "Verify Tester", email: next, phone: "" });
    await sendVerificationEmail(u.id, next, "Verify Tester", { newEmail: next });
    await run("UPDATE users SET email = ? WHERE id = ?", next, other.id); // someone else got there first

    expect((await verifyEmailToken(tokenFrom(lastLinkFor(next)))).ok).toBe(false);
    expect((await userRow(u.id))?.email).toBe(u.email);
  });

  it("won't switch to an address another account already uses", async () => {
    const u = await makeUser({ verified: true });
    const other = await makeUser({ verified: true });
    const result = await updateUserDetails({ id: u.id, email: u.email, name: "Verify Tester", phone: "", role: "practitioner", practitionerId: u.practitionerId }, { name: "Verify Tester", email: other.email, phone: "" });
    expect(result.ok).toBe(false);
  });
});

describe("a password link also proves the address", () => {
  it("setting a password from an emailed link confirms the account", async () => {
    const u = await makeUser({ verified: false, role: "admin" });
    await requestPasswordReset(u.email);
    const link = lastLinkFor(u.email);
    expect(link).toBeDefined();

    const result = await resetPassword(tokenFrom(link), "Brand-new-pass-1");
    expect(result.ok).toBe(true);
    expect((await userRow(u.id))?.email_verified_at).not.toBeNull();
  });
});
