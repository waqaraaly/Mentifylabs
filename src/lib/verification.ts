import type { Practitioner } from "@/types/practitioner";

export const VERIFICATION_WINDOW_DAYS = 60;

/** Calendar days left until the 60-day verification deadline (negative once it's passed). */
export function verificationDaysLeft(dateJoined: string): number {
  const joined = new Date(`${dateJoined}T00:00:00Z`);
  const deadline = joined.getTime() + VERIFICATION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000));
}

export function isVerificationOverdue(dateJoined: string): boolean {
  return verificationDaysLeft(dateJoined) < 0;
}

/** Whether the "please verify" reminder is worth showing at all right now. */
export function needsVerificationReminder(p: Pick<Practitioner, "verificationStatus">): boolean {
  return p.verificationStatus !== "verified";
}
