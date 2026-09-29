import "server-only";
import { first, run } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { MIN_PASSWORD_LENGTH, hashPassword } from "@/lib/password";
import { homeFor, randomToken, sha256Hex, startSession, type Role } from "@/lib/session";
import { siteOrigin } from "@/lib/siteOrigin";

const SELF_SERVE_MINUTES = 60;
const ADMIN_LINK_DAYS = 7;
const REQUEST_COOLDOWN_SECONDS = 60;

async function createResetLink(userId: string, lifetimeMs: number): Promise<string> {
  const token = randomToken();
  await run("DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL", userId);
  await run(
    "INSERT INTO password_resets (id, user_id, expires_at) VALUES (?, ?, ?)",
    await sha256Hex(token),
    userId,
    new Date(Date.now() + lifetimeMs).toISOString(),
  );
  return `${await siteOrigin()}/reset-password?token=${encodeURIComponent(token)}`;
}

/**
 * "Forgot password": emails a link if the address belongs to an active account. It says
 * nothing either way, so the form can't be used to find out who has an account.
 */
export async function requestPasswordReset(emailInput: string): Promise<void> {
  const email = emailInput.trim().toLowerCase();
  const user = await first<{ id: string }>(
    `SELECT u.id FROM users u
      WHERE u.email = ?
        AND (u.role = 'admin' OR EXISTS (SELECT 1 FROM practitioners p
              WHERE p.id = u.practitioner_id AND p.status NOT IN ('suspended', 'rejected')))
        AND NOT EXISTS (SELECT 1 FROM password_resets r
              WHERE r.user_id = u.id AND r.created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?))`,
    email,
    `-${REQUEST_COOLDOWN_SECONDS} seconds`,
  );
  if (!user) return;

  const link = await createResetLink(user.id, SELF_SERVE_MINUTES * 60 * 1000);
  await sendEmail({
    to: email,
    subject: "Reset your MentifyLabs password",
    text: `Someone asked to reset the password for your MentifyLabs account.\n\nChoose a new password here (the link works once, for ${SELF_SERVE_MINUTES} minutes):\n${link}\n\nIf this wasn't you, ignore this email. Your password stays the same.`,
  });
}

interface ResetRow {
  id: string;
  user_id: string;
  role: Role;
}

async function findValidReset(token: string): Promise<ResetRow | null> {
  if (!token) return null;
  return first<ResetRow>(
    `SELECT r.id, r.user_id, u.role FROM password_resets r JOIN users u ON u.id = r.user_id
      WHERE r.id = ? AND r.used_at IS NULL AND r.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    await sha256Hex(token),
  );
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  return (await findValidReset(token)) !== null;
}

/** Sets the new password, uses up the link, signs out every other session, and signs this browser in. */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ ok: true; home: string } | { ok: false; message: string }> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  const reset = await findValidReset(token);
  if (!reset) return { ok: false, message: "This link has expired or was already used. Ask for a new one." };

  const used = await run(
    "UPDATE password_resets SET used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND used_at IS NULL",
    reset.id,
  );
  if (used === 0) return { ok: false, message: "This link was already used. Ask for a new one." };

  await run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(newPassword), reset.user_id);
  await run("DELETE FROM sessions WHERE user_id = ?", reset.user_id);
  await run(
    "DELETE FROM login_attempts WHERE email = (SELECT email FROM users WHERE id = ?)",
    reset.user_id,
  );
  await startSession(reset.user_id);
  return { ok: true, home: homeFor(reset.role) };
}

/**
 * Admin "Send reset link": makes sure the practitioner has a sign-in account (creating one with an
 * unusable password if they were added by an admin), then creates a 7-day link. The link is always
 * returned so the admin can pass it on even when email isn't set up yet.
 */
export async function adminResetLink(
  practitionerSlug: string,
): Promise<{ ok: true; link: string; emailed: boolean; email: string } | { ok: false; message: string }> {
  const practitioner = await first<{ id: string; email: string; full_name: string }>(
    "SELECT id, email, full_name FROM practitioners WHERE slug = ?",
    practitionerSlug,
  );
  if (!practitioner) return { ok: false, message: "Practitioner not found." };

  let user = await first<{ id: string; email: string }>(
    "SELECT id, email FROM users WHERE practitioner_id = ?",
    practitioner.id,
  );
  if (!user) {
    const email = practitioner.email.trim().toLowerCase();
    if (await first("SELECT 1 FROM users WHERE email = ?", email)) {
      return { ok: false, message: `Another account already uses ${email}. Change this practitioner's email first.` };
    }
    user = await first<{ id: string; email: string }>(
      `INSERT INTO users (email, name, password_hash, role, practitioner_id)
       VALUES (?, ?, ?, 'practitioner', ?) RETURNING id, email`,
      email,
      practitioner.full_name,
      await hashPassword(randomToken()),
      practitioner.id,
    );
  }

  const link = await createResetLink(user!.id, ADMIN_LINK_DAYS * 24 * 60 * 60 * 1000);
  const emailed = await sendEmail({
    to: user!.email,
    subject: "Set your MentifyLabs password",
    text: `Hi ${practitioner.full_name},\n\nUse this link to set your MentifyLabs password and sign in (it works once, for ${ADMIN_LINK_DAYS} days):\n${link}`,
  });
  return { ok: true, link, emailed, email: user!.email };
}
