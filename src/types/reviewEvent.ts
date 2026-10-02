export type ReviewEventKind =
  | "account_approved"
  | "account_rejected"
  | "account_suspended"
  | "account_reactivated"
  | "verification_submitted"
  | "verification_approved"
  | "verification_rejected";

export interface ReviewEvent {
  id: string;
  practitionerSlug: string;
  kind: ReviewEventKind;
  note?: string;
  /** Who made the decision; empty for events the practitioner triggered themselves. */
  actorName?: string;
  createdAt: string;
}

export const REVIEW_EVENT_LABELS: Record<ReviewEventKind, { label: string; tone: "ok" | "danger" | "info" }> = {
  account_approved: { label: "Account approved", tone: "ok" },
  account_rejected: { label: "Account rejected", tone: "danger" },
  account_suspended: { label: "Account suspended", tone: "danger" },
  account_reactivated: { label: "Account reactivated", tone: "ok" },
  verification_submitted: { label: "Verification submitted", tone: "info" },
  verification_approved: { label: "Verification approved", tone: "ok" },
  verification_rejected: { label: "Verification sent back", tone: "danger" },
};
