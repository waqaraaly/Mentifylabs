import type { Practitioner } from "@/types/practitioner";
import { isVerificationRejected } from "@/lib/verification";

/**
 * One place that answers "what state is this practitioner in, and what can Super Admin do about it?".
 * The three stored statuses (account, profile, verification) stay as they are; this reads them together,
 * so the list, the detail page, the buttons and the server checks can never disagree.
 */

/**
 * The profile has two states: Live (the practitioner's page is being served to the public) and Not live.
 * It is live only while the account is active, the credentials are verified and the practitioner has published it.
 * Whatever the stored profile status says, anything other than "published" counts as unpublished.
 */
export const isLive = (p: Pick<Practitioner, "status" | "profileStatus" | "verificationStatus">): boolean =>
  p.status === "active" && p.profileStatus === "published" && p.verificationStatus === "verified";

type Fields = Pick<Practitioner, "status" | "profileStatus" | "verificationStatus" | "verificationNote"> & {
  emailUnconfirmed?: boolean;
  creationMethod?: Practitioner["creationMethod"];
  hasLogin?: boolean;
};

export type HeadlineKey =
  | "suspended"
  | "invite_not_sent"
  | "invite_sent"
  | "email_not_confirmed"
  | "awaiting_review"
  | "verification_rejected"
  | "live"
  | "verified_not_live"
  | "not_verified";

export type HeadlineTone = "ok" | "warn" | "danger" | "neutral";

export interface Headline {
  key: HeadlineKey;
  label: string;
  tone: HeadlineTone;
  /** One line saying why, for tooltips and the detail page. */
  hint: string;
}

const HEADLINES: Record<HeadlineKey, Omit<Headline, "key">> = {
  suspended: { label: "Suspended", tone: "danger", hint: "Signed out and offline until an admin reactivates the account." },
  invite_not_sent: { label: "Invite not sent", tone: "warn", hint: "Added by an admin, but no invite has gone out yet, so they have no way to sign in." },
  invite_sent: { label: "Invite sent", tone: "neutral", hint: "Invited, but they haven't set their password yet." },
  email_not_confirmed: { label: "Email not confirmed", tone: "neutral", hint: "Signed up but hasn't confirmed their email yet, so they can't sign in." },
  awaiting_review: { label: "Awaiting review", tone: "warn", hint: "Credentials submitted and waiting for a decision." },
  verification_rejected: { label: "Verification rejected", tone: "warn", hint: "Credentials were sent back. They can resubmit." },
  live: { label: "Live", tone: "ok", hint: "The practitioner's page is live to the public." },
  verified_not_live: { label: "Unpublished", tone: "neutral", hint: "Verified, but the practitioner hasn't published the profile." },
  not_verified: { label: "Not verified", tone: "neutral", hint: "Active, but credentials aren't verified yet, so the profile can't go live." },
};

export function headlineKey(p: Fields): HeadlineKey {
  if (p.status === "suspended") return "suspended";
  if (p.creationMethod === "super_admin") {
    if (p.hasLogin === false) return "invite_not_sent";
    if (p.emailUnconfirmed) return "invite_sent";
  }
  if (p.emailUnconfirmed) return "email_not_confirmed";
  if (p.verificationStatus === "pending") return "awaiting_review";
  if (isVerificationRejected(p)) return "verification_rejected";
  if (p.verificationStatus === "verified") return p.profileStatus === "published" ? "live" : "verified_not_live";
  return "not_verified";
}

export function headlineOf(p: Fields): Headline {
  const key = headlineKey(p);
  return { key, ...HEADLINES[key] };
}

/** The headline statuses in the order the list filter offers them. */
export const HEADLINE_FILTER_ORDER: HeadlineKey[] = [
  "awaiting_review",
  "invite_not_sent",
  "invite_sent",
  "email_not_confirmed",
  "live",
  "verified_not_live",
  "not_verified",
  "verification_rejected",
  "suspended",
];

export const headlineLabel = (key: HeadlineKey) => HEADLINES[key].label;

// ---- What Super Admin may do ----

export const canSuspend = (p: Pick<Practitioner, "status">) => p.status === "active";

export const canReactivate = (p: Pick<Practitioner, "status">) => p.status === "suspended";

/** Approve or send back a credentials submission: only while one is waiting. */
export const canDecideSubmission = (p: Pick<Practitioner, "verificationStatus" | "status">) =>
  p.verificationStatus === "pending" && p.status === "active";

/** Re-send the confirmation link to someone who signed up themselves and has not confirmed their email yet. Admin-added practitioners get an invite instead. */
export const canResendConfirmation = (p: { creationMethod: Practitioner["creationMethod"]; emailUnconfirmed?: boolean; hasLogin?: boolean; status: Practitioner["status"] }) =>
  p.creationMethod === "self" && !!p.emailUnconfirmed && p.hasLogin !== false && p.status === "active";

/** Reactivating straight to a live profile needs verified credentials, the same rule practitioners publish under. */
export const canReactivateLive = (p: Pick<Practitioner, "verificationStatus">) => p.verificationStatus === "verified";

// ---- Grouped by who has to act ----

export type HeadlineGroupId = "action" | "waiting" | "live" | "suspended";

export const HEADLINE_GROUPS: { id: HeadlineGroupId; label: string; keys: HeadlineKey[] }[] = [
  { id: "action", label: "Needs your action", keys: ["awaiting_review", "invite_not_sent"] },
  { id: "waiting", label: "Waiting on practitioner", keys: ["invite_sent", "email_not_confirmed", "not_verified", "verification_rejected", "verified_not_live"] },
  { id: "live", label: "Live", keys: ["live"] },
  { id: "suspended", label: "Suspended", keys: ["suspended"] },
];

export const headlineGroupOf = (key: HeadlineKey): HeadlineGroupId =>
  HEADLINE_GROUPS.find((g) => g.keys.includes(key))!.id;
