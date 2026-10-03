"use server";

import { revalidatePath } from "next/cache";
import { changePassword, requireAdmin, updateUserDetails } from "@/lib/session";
import { sendVerificationEmail } from "@/lib/emailVerification";

/** Saves the admin's name and email. The email is also the admin's sign-in email. */
export async function saveAccountAction(input: { name: string; email: string }) {
  const admin = await requireAdmin();
  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) return { ok: false, message: "Name is required." };
  const result = await updateUserDetails(admin, { name, email, phone: admin.phone });
  if (!result.ok) return result;
  if (result.pendingEmail) await sendVerificationEmail(admin.id, result.pendingEmail, name, { newEmail: result.pendingEmail });
  revalidatePath("/admin", "layout");
  return { ok: true, message: result.pendingEmail ? result.message : "Account saved" };
}

export async function changePasswordAction(current: string, next: string, confirm: string) {
  if (next !== confirm) return { ok: false, message: "New passwords don't match." };
  return changePassword(await requireAdmin(), current, next);
}
