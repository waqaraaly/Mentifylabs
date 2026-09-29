"use server";

import { requestPasswordReset } from "@/lib/passwordReset";

export interface ForgotPasswordState {
  sentTo?: string;
}

export async function requestResetAction(_prev: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const email = formData.get("email")?.toString().trim() ?? "";
  if (email) await requestPasswordReset(email);
  // The same answer whether or not the account exists.
  return { sentTo: email };
}
