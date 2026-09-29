import { first } from "@/lib/db";
import { changePassword, requireRole, updateUserDetails } from "@/lib/session";
import { sendVerificationEmail, resendVerificationEmail } from "@/lib/emailVerification";

/**
 * The practitioner's private sign-in account: email, name and notification phone.
 * Deliberately separate from the public profile (see Practitioner in src/types),
 * which has its own display name and public contact details.
 */
export async function getAccount(): Promise<{ name: string; email: string; phone: string; emailVerified: boolean }> {
  const user = await requireRole("practitioner");
  const row = await first<{ email_verified_at: string | null }>(
    "SELECT email_verified_at FROM users WHERE id = ?",
    user.id,
  );
  return { name: user.name, email: user.email, phone: user.phone, emailVerified: !!row?.email_verified_at };
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
  if (result.ok && details.email.trim().toLowerCase() !== user.email) {
    await sendVerificationEmail(user.id, details.email.trim().toLowerCase(), user.name);
  }
  return result;
}

export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  return changePassword(await requireRole("practitioner"), currentPassword, newPassword);
}
