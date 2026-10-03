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

/**
 * The one approval queue: practitioners who submitted their credentials and are waiting for a decision.
 * Approving verifies them, activates the account and publishes the profile in one step.
 */
export function isAwaitingApproval(p: Pick<Practitioner, "verificationStatus">): boolean {
  return p.verificationStatus === "pending";
}

/**
 * Why this practitioner can't publish right now, or null when they can. The publish button reads it to explain
 * itself, and the server checks the same rule again before it publishes, so the two can never disagree.
 */
export function publishBlockReason(
  p: Pick<Practitioner, "status" | "profileStatus" | "verificationStatus" | "verificationNote">,
): string | null {
  if (p.profileStatus === "hidden" || p.profileStatus === "suspended") {
    return "Your profile has been taken offline by an admin. Contact the MentifyLabs team to have it restored.";
  }
  if (p.verificationStatus === "pending") {
    return "Your credentials are under review. You can publish as soon as they're approved.";
  }
  if (isVerificationRejected(p)) {
    return "Your credentials need changes before you can publish. See the feedback on the Verification page.";
  }
  if (p.verificationStatus !== "verified") {
    return "Verify your credentials to publish your profile.";
  }
  if (p.status !== "active") return "Your account must be active before you can publish.";
  return null;
}
