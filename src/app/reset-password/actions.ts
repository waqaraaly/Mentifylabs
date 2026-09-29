"use server";

import { redirect } from "next/navigation";
import { resetPassword } from "@/lib/passwordReset";

export interface ResetPasswordState {
  error?: string;
}

export async function resetPasswordAction(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const token = formData.get("token")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  if (password !== formData.get("confirm")?.toString()) return { error: "The two passwords don't match." };

  const result = await resetPassword(token, password);
  if (!result.ok) return { error: result.message };
  redirect(result.home);
}
