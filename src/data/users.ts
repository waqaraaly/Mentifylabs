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
    emailVerifiedAt: r.email_verified_at,
  };
}

/** Every Super Admin account, for the Super Admins page. */
export async function getSuperAdmins(): Promise<AdminUser[]> {
  const rows = await all<UserJoinRow>(
    `SELECT u.id, u.name, u.email, u.role, p.slug AS practitioner_slug, p.full_name AS practitioner_full_name,
            u.created_at, u.email_verified_at
       FROM users u LEFT JOIN practitioners p ON p.id = u.practitioner_id
     WHERE u.role = 'admin'
      ORDER BY u.created_at DESC`,
  );
  return rows.map(toAdminUser);
}

async function countAdmins(): Promise<number> {
  const row = await first<{ n: number }>("SELECT count(*) AS n FROM users WHERE role = 'admin'");
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
 * Permanently deletes a Super Admin's sign-in account. Practitioner logins are never deleted from here: removing one
 * would leave a practitioner nobody can sign in as, so they are suspended from their own page instead.
 * Refuses to delete the acting admin's own account or the platform's last Super Admin.
 */
export async function deleteUserPermanently(
  actingUserId: string,
  targetUserId: string,
): Promise<{ ok: boolean; message: string }> {
  if (targetUserId === actingUserId) return { ok: false, message: "You can't delete your own account." };
  const target = await first<{ role: Role }>("SELECT role FROM users WHERE id = ?", targetUserId);
  if (!target) return { ok: false, message: "Account not found." };
  if (target.role !== "admin") {
    return { ok: false, message: "A practitioner's sign-in can't be deleted here. Suspend the practitioner instead." };
  }
  if ((await countAdmins()) <= 1) {
    return { ok: false, message: "At least one Super Admin must remain." };
  }

  await run("DELETE FROM users WHERE id = ?", targetUserId);
  return { ok: true, message: "Account deleted." };
}
