"use server";

import { revalidatePath } from "next/cache";
import { changeAdminPassword, updateAdminSettings, type AdminSettings } from "@/data/adminSettings";
import { requireAdmin, updateUserDetails } from "@/lib/session";

/** Saves the admin's name and email. The email is also the admin's sign-in email. */
export async function saveAccountAction(input: { name: string; email: string }) {
  const admin = await requireAdmin();
  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) return { ok: false, message: "Name is required." };
  const result = await updateUserDetails(admin, { name, email, phone: admin.phone });
  if (!result.ok) return result;
  await updateAdminSettings({ name, email: email.toLowerCase() });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Account saved" };
}

export async function savePreferencesAction(
  input: Pick<AdminSettings, "skipVerificationByDefault" | "notifyNewSignup" | "notifyProfileSubmitted" | "notifyDailyDigest">,
) {
  await requireAdmin();
  await updateAdminSettings(input);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Preferences saved" };
}

export async function changePasswordAction(current: string, next: string, confirm: string) {
  if (next !== confirm) return { ok: false, message: "New passwords don't match." };
  return changeAdminPassword(current, next);
}
