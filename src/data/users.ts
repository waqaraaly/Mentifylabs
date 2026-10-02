import "server-only";
import { all, first, run } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { randomToken, type Role } from "@/lib/session";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Set only for a practitioner-role account: the profile this login belongs to. */
  practitionerSlug: string | null;
  practitionerFullName: string | null;
  createdAt: string;
  disabledAt: string | null;
  emailVerifiedAt: string | null;
}

interface UserJoinRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  practitioner_slug: string | null;
  practitioner_full_name: string | null;
  created_at: string;
  disabled_at: string | null;
  email_verified_at: string | null;
}

function toAdminUser(r: UserJoinRow): AdminUser {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    practitionerSlug: r.practitioner_slug,
    practitionerFullName: r.practitioner_full_name,
    createdAt: r.created_at,
    disabledAt: r.disabled_at,
    emailVerifiedAt: r.email_verified_at,
  };
}

/** Every sign-in account on the platform — both roles — for Manage Users. */
export async function getAllUsers(): Promise<AdminUser[]> {
  const rows = await all<UserJoinRow>(
    `SELECT u.id, u.name, u.email, u.role, p.slug AS practitioner_slug, p.full_name AS practitioner_full_name,
            u.created_at, u.disabled_at, u.email_verified_at
       FROM users u LEFT JOIN practitioners p ON p.id = u.practitioner_id
      ORDER BY u.created_at DESC`,
  );
  return rows.map(toAdminUser);
}

async function countActiveAdmins(): Promise<number> {
  const row = await first<{ n: number }>("SELECT count(*) AS n FROM users WHERE role = 'admin' AND disabled_at IS NULL");
  return row?.n ?? 0;
}

/** Creates a Super Admin account with an unusable password — the caller emails an invite link. */
export async function createAdminUser(input: {
  fullName: string;
  email: string;
}): Promise<{ ok: true; userId: string } | { ok: false; message: string }> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (fullName.length < 2) return { ok: false, message: "Enter a full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  if (await first("SELECT 1 FROM users WHERE email = ?", email)) {
    return { ok: false, message: "An account with this email already exists." };
  }
  const row = await first<{ id: string }>(
    `INSERT INTO users (email, name, password_hash, role, practitioner_id)
     VALUES (?, ?, ?, 'admin', NULL) RETURNING id`,
    email,
    fullName,
    await hashPassword(randomToken()),
  );
  return { ok: true, userId: row!.id };
}

/**
 * Blocks (or restores) sign-in without deleting the account. Refuses to disable the acting
 * admin's own account, or the platform's last active Super Admin — either would lock everyone out.
 */
export async function setUserDisabled(
  actingUserId: string,
  targetUserId: string,
  disabled: boolean,
): Promise<{ ok: boolean; message: string }> {
  if (disabled && targetUserId === actingUserId) {
    return { ok: false, message: "You can't disable your own account." };
  }
  const target = await first<{ role: Role; disabled_at: string | null }>(
    "SELECT role, disabled_at FROM users WHERE id = ?",
    targetUserId,
  );
  if (!target) return { ok: false, message: "Account not found." };
  if (disabled && target.role === "admin" && !target.disabled_at && (await countActiveAdmins()) <= 1) {
    return { ok: false, message: "At least one active Super Admin must remain." };
  }

  await run("UPDATE users SET disabled_at = ? WHERE id = ?", disabled ? new Date().toISOString() : null, targetUserId);
  if (disabled) await run("DELETE FROM sessions WHERE user_id = ?", targetUserId);
  return { ok: true, message: disabled ? "Account disabled." : "Account re-enabled." };
}

/**
 * Permanently deletes the sign-in account. For a practitioner-role account this only removes
 * their login — their public profile and business data stay intact, managed from Practitioners.
 * Refuses to delete the acting admin's own account or the platform's last active Super Admin.
 */
export async function deleteUserPermanently(
  actingUserId: string,
  targetUserId: string,
): Promise<{ ok: boolean; message: string }> {
  if (targetUserId === actingUserId) return { ok: false, message: "You can't delete your own account." };
  const target = await first<{ role: Role; disabled_at: string | null }>(
    "SELECT role, disabled_at FROM users WHERE id = ?",
    targetUserId,
  );
  if (!target) return { ok: false, message: "Account not found." };
  if (target.role === "admin" && !target.disabled_at && (await countActiveAdmins()) <= 1) {
    return { ok: false, message: "At least one active Super Admin must remain." };
  }

  await run("DELETE FROM users WHERE id = ?", targetUserId);
  return { ok: true, message: "Account deleted." };
}
