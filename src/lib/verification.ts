import type { Practitioner } from "@/types/practitioner";

/**
 * Super Admin sent the last submission back. Stored as "unverified" plus the feedback note
 * (submitting again or approving clears the note), so no separate DB status is needed.
 */
export function isVerificationRejected(p: Pick<Practitioner, "verificationStatus" | "verificationNote">): boolean {
  return p.verificationStatus === "unverified" && !!p.verificationNote;
}

/** Whether the "please verify" reminder is worth showing at all right now. */
export function needsVerificationReminder(p: Pick<Practitioner, "verificationStatus">): boolean {
  return p.verificationStatus !== "verified";
}

/** Calendar days since a verification request was submitted, for sorting/display in the admin queue. */
export function daysSinceSubmitted(submittedAt: string | undefined): number | null {
  if (!submittedAt) return null;
  return Math.floor((Date.now() - new Date(submittedAt).getTime()) / (24 * 60 * 60 * 1000));
}
