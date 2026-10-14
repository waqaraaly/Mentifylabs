import "server-only";
import { first, run } from "@/lib/db";
import { sendBrandedEmail } from "@/lib/notifications";
import { randomToken, sha256Hex, type Role } from "@/lib/session";
import { siteOrigin } from "@/lib/siteOrigin";

const LINK_DAYS = 7;
const REQUEST_COOLDOWN_SECONDS = 60;

/**
 * Confirms an email address, and is what lets a new account sign in. `newEmail` is set when it confirms a change
 * of address instead of the first one: the address in `email` is where the link goes.
 */
export async function sendVerificationEmail(
  userId: string,
  email: string,
  fullName: string,
  opts: { newEmail?: string } = {},
): Promise<void> {
  const token = randomToken();
  await run("DELETE FROM email_verifications WHERE user_id = ? AND used_at IS NULL", userId);
  await run(
    "INSERT INTO email_verifications (id, user_id, expires_at, new_email) VALUES (?, ?, ?, ?)",
    await sha256Hex(token),
    userId,
    new Date(Date.now() + LINK_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    opts.newEmail ?? null,
  );
  const link = `${await siteOrigin()}/verify-email?token=${encodeURIComponent(token)}`;
  const change = !!opts.newEmail;
  await sendBrandedEmail({
    to: email,
    subject: change ? "Confirm your new MentifyLabs email" : "Confirm your MentifyLabs email",
    greeting: `Hi ${fullName},`,
    content: {
      eyebrow: "Email",
      heading: change ? "Confirm your new email address" : "Confirm your email address",
      body: [
        change
          ? "Confirm this is your new email address. Until you do, you keep signing in with your current one."
          : "Confirm this is your email address to finish creating your account and sign in.",
      ],
      button: { label: "Confirm email", url: link },
      footnote: `The link works once and expires in ${LINK_DAYS} days. If this wasn't you, you can ignore this email.`,
    },
  });
}

/** Re-sends the link for whatever is waiting to be confirmed (a pending change first, otherwise the account's own address). At most once a minute per account. */
export async function resendVerificationEmail(userId: string): Promise<{ ok: boolean; message: string }> {
  const user = await first<{ email: string; pending_email: string | null; name: string; email_verified_at: string | null }>(
    "SELECT email, pending_email, name, email_verified_at FROM users WHERE id = ?",
    userId,
  );
  if (!user) return { ok: false, message: "Account not found." };
  if (!user.pending_email && user.email_verified_at) return { ok: false, message: "Your email is already confirmed." };

  const recent = await first(
    "SELECT 1 FROM email_verifications WHERE user_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)",
    userId,
    `-${REQUEST_COOLDOWN_SECONDS} seconds`,
  );
  if (recent) return { ok: false, message: "A confirmation email was just sent. Check your inbox." };

  if (user.pending_email) await sendVerificationEmail(userId, user.pending_email, user.name, { newEmail: user.pending_email });
  else await sendVerificationEmail(userId, user.email, user.name);
  return { ok: true, message: "Confirmation email sent." };
}

/**
 * For someone who isn't signed in (sign-up and sign-in screens): re-sends the link to an address that hasn't been
 * confirmed. It says nothing about whether the address has an account, so it can't be used to find out.
 */
export async function resendConfirmationForEmail(emailInput: string): Promise<void> {
  const email = emailInput.trim().toLowerCase();
  const user = await first<{ id: string }>(
    "SELECT id FROM users WHERE email = ? AND email_verified_at IS NULL",
    email,
  );
  if (user) await resendVerificationEmail(user.id);
}

interface VerificationRow {
  id: string;
  user_id: string;
  new_email: string | null;
}

async function findValidVerification(token: string): Promise<VerificationRow | null> {
  if (!token) return null;
  return first<VerificationRow>(
    `SELECT id, user_id, new_email FROM email_verifications
      WHERE id = ? AND used_at IS NULL AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    await sha256Hex(token),
  );
}

/** Read-only check, so merely opening the link (or a mail scanner fetching it) never uses it up. */
export async function isVerificationTokenValid(token: string): Promise<boolean> {
  return (await findValidVerification(token)) !== null;
}

export type VerifyResult = { ok: true; userId: string; role: Role; changedEmail: boolean } | { ok: false; message: string };

/**
 * Confirms the address the link was sent to. For a first confirmation that unlocks sign-in; for a change of
 * address it swaps the sign-in email (and the practitioner's contact email) over to the new one.
 */
export async function verifyEmailToken(token: string): Promise<VerifyResult> {
  const verification = await findValidVerification(token);
  if (!verification) return { ok: false, message: "This link has expired or was already used." };

  const user = await first<{ id: string; role: Role; practitioner_id: string | null }>(
    "SELECT id, role, practitioner_id FROM users WHERE id = ?",
    verification.user_id,
  );
  if (!user) return { ok: false, message: "This link has expired or was already used." };

  const changedEmail = !!verification.new_email;
  if (verification.new_email) {
    const taken = await first("SELECT 1 FROM users WHERE email = ? AND id <> ?", verification.new_email, user.id);
    if (taken) return { ok: false, message: "That email address is now used by another account." };
  }

  const used = await run(
    "UPDATE email_verifications SET used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND used_at IS NULL",
    verification.id,
  );
  if (used === 0) return { ok: false, message: "This link was already used." };

  if (verification.new_email) {
    await run(
      "UPDATE users SET email = ?, pending_email = NULL, email_verified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
      verification.new_email,
      user.id,
    );
    if (user.practitioner_id) await run("UPDATE practitioners SET email = ? WHERE id = ?", verification.new_email, user.practitioner_id);
  } else {
    await run("UPDATE users SET email_verified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?", user.id);
  }
  return { ok: true, userId: user.id, role: user.role, changedEmail };
}
