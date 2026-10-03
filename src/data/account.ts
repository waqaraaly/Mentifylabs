import { first } from "@/lib/db";
import { changePassword, requireRole, updateUserDetails } from "@/lib/session";
import { sendVerificationEmail, resendVerificationEmail } from "@/lib/emailVerification";

/**
 * The practitioner's private sign-in account: email, name and notification phone.
 * Deliberately separate from the public profile (see Practitioner in src/types),
 * which has its own display name and public contact details.
 */
export async function getAccount(): Promise<{ name: string; email: string; phone: string; pendingEmail: string | null }> {
  const user = await requireRole("practitioner");
  const row = await first<{ pending_email: string | null }>("SELECT pending_email FROM users WHERE id = ?", user.id);
  return { name: user.name, email: user.email, phone: user.phone, pendingEmail: row?.pending_email ?? null };
}

export async function resendAccountVerificationEmail(): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole("practitioner");
  return resendVerificationEmail(user.id);
}

export async function updateAccountDetails(details: {
  name: string;
  email: string;
  phone: string;
}): Promise<{ ok: boolean; message: string }> {
  const user = await requireRole("practitioner");
  const result = await updateUserDetails(user, details);
  // A changed address waits for confirmation: the link goes to the new one.
  if (result.ok && result.pendingEmail) {
    await sendVerificationEmail(user.id, result.pendingEmail, details.name || user.name, { newEmail: result.pendingEmail });
  }
  return result;
}

export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  return changePassword(await requireRole("practitioner"), currentPassword, newPassword);
}
