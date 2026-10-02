import "server-only";
import { first, run } from "@/lib/db";
import { sendBrandedEmail } from "@/lib/notifications";
import { randomToken, sha256Hex } from "@/lib/session";
import { siteOrigin } from "@/lib/siteOrigin";

const LINK_DAYS = 7;
const REQUEST_COOLDOWN_SECONDS = 60;

/**
 * Doesn't gate sign-in or the portal — Super Admin approval remains the real
 * gate before a profile is published. This only confirms the address itself
 * is real, and gives admins a signal while reviewing a pending profile.
 */
export async function sendVerificationEmail(userId: string, email: string, fullName: string): Promise<void> {
  const token = randomToken();
  await run("DELETE FROM email_verifications WHERE user_id = ? AND used_at IS NULL", userId);
  await run(
    "INSERT INTO email_verifications (id, user_id, expires_at) VALUES (?, ?, ?)",
    await sha256Hex(token),
    userId,
    new Date(Date.now() + LINK_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  );
  const link = `${await siteOrigin()}/verify-email?token=${encodeURIComponent(token)}`;
  await sendBrandedEmail({
    to: email,
    subject: "Confirm your email — MentifyLabs",
    greeting: `Hi ${fullName},`,
    content: {
      eyebrow: "Email",
      heading: "Confirm your email address",
      body: ["Confirm this is your email address so we can reach you about your account."],
      button: { label: "Confirm email", url: link },
      footnote: `The link works once and expires in ${LINK_DAYS} days. If you didn't sign up for MentifyLabs, you can ignore this email.`,
    },
  });
}

/** Re-sends a verification email, at most once per minute per account. */
export async function resendVerificationEmail(userId: string): Promise<{ ok: boolean; message: string }> {
  const user = await first<{ email: string; full_name: string; email_verified_at: string | null }>(
    `SELECT u.email, p.full_name, u.email_verified_at
       FROM users u LEFT JOIN practitioners p ON p.id = u.practitioner_id
      WHERE u.id = ?`,
    userId,
  );
  if (!user) return { ok: false, message: "Account not found." };
  if (user.email_verified_at) return { ok: false, message: "Your email is already verified." };

  const recent = await first(
    "SELECT 1 FROM email_verifications WHERE user_id = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)",
    userId,
    `-${REQUEST_COOLDOWN_SECONDS} seconds`,
  );
  if (recent) return { ok: false, message: "A verification email was just sent — check your inbox." };

  await sendVerificationEmail(userId, user.email, user.full_name);
  return { ok: true, message: "Verification email sent." };
}

interface VerificationRow {
  id: string;
  user_id: string;
}

async function findValidVerification(token: string): Promise<VerificationRow | null> {
  if (!token) return null;
  return first<VerificationRow>(
    `SELECT id, user_id FROM email_verifications
      WHERE id = ? AND used_at IS NULL AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    await sha256Hex(token),
  );
}

export async function verifyEmailToken(token: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const verification = await findValidVerification(token);
  if (!verification) return { ok: false, message: "This link has expired or was already used." };

  const used = await run(
    "UPDATE email_verifications SET used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND used_at IS NULL",
    verification.id,
  );
  if (used === 0) return { ok: false, message: "This link was already used." };

  await run(
    "UPDATE users SET email_verified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
    verification.user_id,
  );
  return { ok: true };
}
