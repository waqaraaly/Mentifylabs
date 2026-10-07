import type { ColorThemeId } from "@/lib/themes";

export type SessionType = "online" | "offline" | "both";

export type PractitionerStatus = "active" | "suspended";

/**
 * Independent from `status` (the account's ability to sign in). This tracks
 * the public profile page's moderation state — an active account can still
 * have a hidden or incomplete profile.
 */
export type ProfileStatus = "draft" | "in_review" | "published" | "hidden" | "incomplete" | "suspended";

export type PractitionerCreationMethod = "self" | "super_admin";

/**
 * Credential verification (degree/license/ID review) — independent from
 * `status` and `profileStatus`. A practitioner can be active and published
 * while still "unverified"; the public-profile checkmark reflects this.
 */
export type VerificationStatus = "unverified" | "pending" | "verified";

export interface SocialLink {
  platform: "instagram" | "facebook" | "linkedin" | "twitter" | "youtube";
  url: string;
}

/** A free-form way to reach the practitioner (WhatsApp, alternate email, Telegram, …). */
export interface ContactMethod {
  label: string;
  value: string;
  /** Whether this shows on the public profile page, or stays visible to the practitioner only. */
  isPublic: boolean;
}

export interface Practitioner {
  /** Used in the public URL, e.g. "dr-ali" -> /dr-ali. A hidden placeholder until the practitioner chooses one (see slugChosenAt). */
  slug: string;
  /** When the practitioner chose their profile link. Empty until they do; the profile can't be published before then. */
  slugChosenAt?: string;
  fullName: string;
  professionalTitle: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  /** One-line summary shown under the name on the public profile hero. */
  shortBio?: string;
  bio: string;
  specializations: string[];
  /** The kinds of sessions/services offered, e.g. "Individual Therapy", "Couples Counselling". */
  services: string[];
  experienceYears: number;
  education: string[];
  /** "Role, Organization, Years" — same free-form shape as `education`. */
  workExperience?: string[];
  languages: string[];
  sessionType: SessionType;
  /** One general fee range, independent of session mode (0 = not set). */
  feeRange: { currency: string; min: number; max: number };
  /** Where in-person sessions are held (clinic, hospital or city). Only set for on-site / both. */
  location?: string;
  /** The clock this practitioner works on, as a zone name like "Asia/Karachi". Their slots and sessions are times on it. */
  timezone: string;
  socialLinks: SocialLink[];
  websiteUrl?: string;
  contactMethods: ContactMethod[];
  /** The public profile page's color palette. Defaults to "sage" when unset. */
  colorTheme?: ColorThemeId;

  // Super Admin account lifecycle
  status: PractitionerStatus;
  profileStatus: ProfileStatus;
  creationMethod: PractitionerCreationMethod;
  dateJoined: string;
  lastSignIn?: string;
  approvedOn?: string;
  suspendedOn?: string;
  rejectionNote?: string;

  // Credential verification (degree/license/ID) — see VerificationStatus.
  verificationStatus: VerificationStatus;
  verificationSubmittedAt?: string;
  verifiedOn?: string;
  verificationNote?: string;
  /** Set once they dismiss the first-login setup popup; shown only until then. */
  verificationPromptSeenAt?: string;

  /** Set once they finish (or skip) the guided first-login setup at /onboarding. Gates dashboard access. */
  onboardedAt?: string;

  /** True while the sign-in email has not been confirmed yet, so they cannot sign in. Only loaded for Super Admin lists. */
  emailUnconfirmed?: boolean;
  /** When the sign-in email was confirmed (for admin-added practitioners, when they set their password). Only loaded for Super Admin lists. */
  emailConfirmedAt?: string;
  /** Whether a sign-in account exists yet. Practitioners added by Super Admin get one when the invite is sent. Only loaded for Super Admin lists. */
  hasLogin?: boolean;

  /** False while the practitioner has paused new bookings: the profile stays up, but nobody can book. */
  acceptingBookings: boolean;
}
