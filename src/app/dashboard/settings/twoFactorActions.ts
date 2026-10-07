"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { disableTwoFactor, enableTwoFactor, requestDisableCode, requestEnableCode } from "@/lib/twoFactor";

export interface TwoFactorResult {
  ok: boolean;
  message: string;
}

/** Emails the practitioner a code to confirm turning two-step sign-in on or off. */
export async function requestTwoFactorCodeAction(purpose: "enable" | "disable"): Promise<TwoFactorResult> {
  const user = await requireRole("practitioner");
  const result = purpose === "enable" ? await requestEnableCode(user) : await requestDisableCode(user);
  return result.ok ? { ok: true, message: `We sent a code to ${user.email}.` } : { ok: false, message: result.message };
}

export async function enableTwoFactorAction(code: string): Promise<TwoFactorResult> {
  const user = await requireRole("practitioner");
  const result = await enableTwoFactor(user, code);
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Two-step sign-in is on. Your other devices have been signed out." };
}

export async function disableTwoFactorAction(password: string, code: string): Promise<TwoFactorResult> {
  const user = await requireRole("practitioner");
  const result = await disableTwoFactor(user, password, code);
  if (!result.ok) return { ok: false, message: result.message };
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "Two-step sign-in is off." };
}
