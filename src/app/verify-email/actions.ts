"use server";

import { redirect } from "next/navigation";
import { resendConfirmationForEmail, verifyEmailToken } from "@/lib/emailVerification";
import { clientIp, isLimited, recordHit } from "@/lib/rateLimit";
import { homeFor, startSession } from "@/lib/session";

export interface ConfirmState {
  error?: string;
}

/** The "Confirm my email" button: confirms the address, signs them in, and sends them to their portal. */
export async function confirmEmailAction(_prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const result = await verifyEmailToken(formData.get("token")?.toString() ?? "");
  if (!result.ok) return { error: result.message };

  await startSession(result.userId);
  redirect(homeFor(result.role));
}

export interface ResendState {
  message?: string;
  error?: string;
}

const MAX_RESENDS_PER_HOUR = 5;

/**
 * "Send me the confirmation link again", for someone who isn't signed in. The answer is the same whether or not
 * the address has an account, and each network address is limited so it can't be used to flood an inbox.
 */
export async function resendConfirmationAction(_prev: ResendState, formData: FormData): Promise<ResendState> {
  const email = formData.get("email")?.toString().trim() ?? "";
  if (!email) return { error: "Enter your email address." };

  // (Local development has no Cloudflare address header, so it isn't throttled.)
  const ip = await clientIp();
  const key = `resend:${ip}`;
  if (ip !== "local" && (await isLimited(key, MAX_RESENDS_PER_HOUR, 60))) {
    return { error: "Too many requests. Please try again in an hour." };
  }
  if (ip !== "local") await recordHit(key);

  await resendConfirmationForEmail(email);
  return { message: "If that address is waiting to be confirmed, we've just sent a new link. It can take a minute to arrive." };
}
