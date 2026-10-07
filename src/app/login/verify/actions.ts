"use server";

import { homeFor } from "@/lib/session";
import { signInDestination } from "@/lib/signInDestination";
import { completeLoginChallenge, resendLoginCode } from "@/lib/twoFactor";

export interface VerifyState {
  error?: string;
  message?: string;
  /** The code can't be used any more, so the form offers to start the sign-in again. */
  restart?: boolean;
  /** Set once the code was right and they are signed in. The form navigates there, so the loader starts only now. */
  redirectTo?: string;
}

export async function verifyCodeAction(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const result = await completeLoginChallenge(formData.get("code")?.toString() ?? "");
  if (!result.ok) return { error: result.message, restart: result.dead };

  const home = homeFor(result.role);
  return { redirectTo: signInDestination(formData.get("next")?.toString(), home) };
}

export async function resendCodeAction(): Promise<VerifyState> {
  const result = await resendLoginCode();
  if (!result.ok) return { error: result.message, restart: result.dead };
  return { message: "A new code is on its way." };
}
