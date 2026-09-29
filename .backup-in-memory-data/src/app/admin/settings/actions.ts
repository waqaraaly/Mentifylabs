"use server";

import { revalidatePath } from "next/cache";
import { changeAdminPassword, updateAdminSettings, type AdminSettings } from "@/data/adminSettings";

export async function saveAccountAction(input: { name: string; email: string }) {
  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) return { ok: false, message: "Name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  await updateAdminSettings({ name, email });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Account saved" };
}

export async function savePreferencesAction(
  input: Pick<AdminSettings, "skipVerificationByDefault" | "notifyNewSignup" | "notifyProfileSubmitted" | "notifyDailyDigest">,
) {
  await updateAdminSettings(input);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Preferences saved" };
}

export async function changePasswordAction(current: string, next: string, confirm: string) {
  if (next !== confirm) return { ok: false, message: "New passwords don't match." };
  return changeAdminPassword(current, next);
}
