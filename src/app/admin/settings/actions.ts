"use server";

import { revalidatePath } from "next/cache";
import { changePassword, requireAdmin, updateUserDetails } from "@/lib/session";
import { sendVerificationEmail } from "@/lib/emailVerification";
import { disableTwoFactor, enableTwoFactor, requestDisableCode, requestEnableCode } from "@/lib/twoFactor";

/** Saves the admin's name and email. The email is also the admin's sign-in email. */
export async function saveAccountAction(input: { name: string; email: string; currentPassword?: string }) {
  const admin = await requireAdmin();
  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) return { ok: false, message: "Name is required." };
  const result = await updateUserDetails(admin, { name, email, phone: admin.phone, currentPassword: input.currentPassword });
  if (!result.ok) return result;
  if (result.pendingEmail) await sendVerificationEmail(admin.id, result.pendingEmail, name, { newEmail: result.pendingEmail });
  revalidatePath("/admin", "layout");
  return { ok: true, message: result.pendingEmail ? result.message : "Account saved" };
}

export async function changePasswordAction(current: string, next: string, confirm: string) {
  if (next !== confirm) return { ok: false, message: "New passwords don't match." };
  return changePassword(await requireAdmin(), current, next);
}

/** Emails the admin a code to confirm turning two-step sign-in on or off. */
export async function requestTwoFactorCodeAction(purpose: "enable" | "disable") {
  const admin = await requireAdmin();
  const result = purpose === "enable" ? await requestEnableCode(admin) : await requestDisableCode(admin);
  return result.ok ? { ok: true, message: `We sent a code to ${admin.email}.` } : { ok: false, message: result.message };
}

export async function enableTwoFactorAction(code: string) {
  const admin = await requireAdmin();
  const result = await enableTwoFactor(admin, code);
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Two-step sign-in is on. Other devices have been signed out." };
}

export async function disableTwoFactorAction(password: string, code: string) {
  const admin = await requireAdmin();
  const result = await disableTwoFactor(admin, password, code);
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Two-step sign-in is off." };
}
