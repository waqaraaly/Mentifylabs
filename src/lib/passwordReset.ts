import "server-only";
import { first, run } from "@/lib/db";
import { sendBrandedEmail } from "@/lib/notifications";
import { MIN_PASSWORD_LENGTH, hashPassword } from "@/lib/password";
import { MAX_PASSWORD_LENGTH, homeFor, randomToken, sha256Hex, startSession, type Role } from "@/lib/session";
import { siteOrigin } from "@/lib/siteOrigin";
import { adminLinkEmail } from "@/lib/adminLinkEmail";

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
              WHERE p.id = u.practitioner_id AND p.status <> 'suspended'))
        AND NOT EXISTS (SELECT 1 FROM password_resets r
              WHERE r.user_id = u.id AND r.created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?))`,
    email,
    `-${REQUEST_COOLDOWN_SECONDS} seconds`,
  );
  if (!user) return;

  const link = await createResetLink(user.id, SELF_SERVE_MINUTES * 60 * 1000);
  await sendBrandedEmail({
    to: email,
    subject: "Reset your MentifyLabs password",
    greeting: "Hello,",
    content: {
      eyebrow: "Password",
      heading: "Reset your password",
      body: ["Someone asked to reset the password for your MentifyLabs account. Choose a new one below."],
      button: { label: "Choose a new password", url: link },
      footnote: `The link works once and expires in ${SELF_SERVE_MINUTES} minutes. If this wasn't you, ignore this email — your password stays the same.`,
    },
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
  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, message: `Choose a password of at most ${MAX_PASSWORD_LENGTH} characters.` };
  }
  const reset = await findValidReset(token);
  if (!reset) return { ok: false, message: "This link has expired or was already used. Ask for a new one." };

  const used = await run(
    "UPDATE password_resets SET used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND used_at IS NULL",
    reset.id,
  );
  if (used === 0) return { ok: false, message: "This link was already used. Ask for a new one." };

  await run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(newPassword), reset.user_id);
  // The link only ever reached their inbox, so using it also confirms the address.
  await run(
    "UPDATE users SET email_verified_at = COALESCE(email_verified_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) WHERE id = ?",
    reset.user_id,
  );
  await run("DELETE FROM sessions WHERE user_id = ?", reset.user_id);
  await run(
    `DELETE FROM login_attempts
      WHERE email IN (SELECT email FROM users WHERE id = ?1)
         OR (email >= (SELECT email || '|' FROM users WHERE id = ?1) AND email < (SELECT email || '}' FROM users WHERE id = ?1))`,
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

  let user = await first<{ id: string; email: string; email_verified_at: string | null }>(
    "SELECT id, email, email_verified_at FROM users WHERE practitioner_id = ?",
    practitioner.id,
  );
  if (!user) {
    const email = practitioner.email.trim().toLowerCase();
    if (await first("SELECT 1 FROM users WHERE email = ?", email)) {
      return { ok: false, message: `Another account already uses ${email}, so an invite can't be created for this practitioner.` };
    }
    user = await first<{ id: string; email: string; email_verified_at: string | null }>(
      `INSERT INTO users (email, name, password_hash, role, practitioner_id)
       VALUES (?, ?, ?, 'practitioner', ?) RETURNING id, email, email_verified_at`,
      email,
      practitioner.full_name,
      await hashPassword(randomToken()),
      practitioner.id,
    );
  }

  // Setting a first password is what accepts an invitation, so someone who has never done it is being invited.
  const invite = !user!.email_verified_at;
  const base = await createResetLink(user!.id, ADMIN_LINK_DAYS * 24 * 60 * 60 * 1000);
  const link = invite ? `${base}&invite=1` : base;
  const message = adminLinkEmail({ invite, link, days: ADMIN_LINK_DAYS, name: practitioner.full_name });
  const emailed = await sendBrandedEmail({ to: user!.email, ...message });
  return { ok: true, link, emailed, email: user!.email };
}

/**
 * Same shape as `adminResetLink`, for a newly created Super Admin account
 * instead of a practitioner. The link is always returned so it can be shared
 * manually when email isn't set up.
 */
export async function adminInviteAdmin(
  userId: string,
  email: string,
  fullName: string,
): Promise<{ link: string; emailed: boolean }> {
  const link = `${await createResetLink(userId, ADMIN_LINK_DAYS * 24 * 60 * 60 * 1000)}&invite=1`;
  const emailed = await sendBrandedEmail({
    to: email,
    subject: "You've been invited to MentifyLabs as a Super Admin",
    greeting: `Hi ${fullName},`,
    content: {
      eyebrow: "Invitation",
      heading: "You've been invited as a Super Admin",
      body: ["You've been added as a Super Admin on MentifyLabs. Accept the invitation to create your password and get access."],
      button: { label: "Accept invitation", url: link },
      footnote: `The link works once and expires in ${ADMIN_LINK_DAYS} days.`,
    },
  });
  return { link, emailed };
}

/**
 * Super Admin "Send password link" for another Super Admin. Someone who has never signed in is re-invited; someone who has
 * gets a way to choose a new password. The link is always returned so it can be passed on when email isn't set up.
 */
export async function adminSendAdminLink(
  userId: string,
): Promise<{ ok: true; link: string; emailed: boolean; email: string } | { ok: false; message: string }> {
  const user = await first<{ id: string; email: string; name: string; role: Role; email_verified_at: string | null }>(
    "SELECT id, email, name, role, email_verified_at FROM users WHERE id = ?",
    userId,
  );
  if (!user || user.role !== "admin") return { ok: false, message: "Super Admin not found." };
  if (!user.email_verified_at) {
    const invited = await adminInviteAdmin(user.id, user.email, user.name);
    return { ok: true, ...invited, email: user.email };
  }
  const link = await createResetLink(user.id, ADMIN_LINK_DAYS * 24 * 60 * 60 * 1000);
  const message = adminLinkEmail({ invite: false, link, days: ADMIN_LINK_DAYS, name: user.name });
  const emailed = await sendBrandedEmail({ to: user.email, ...message });
  return { ok: true, link, emailed, email: user.email };
}
