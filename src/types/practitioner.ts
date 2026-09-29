import type { ColorThemeId } from "@/lib/themes";

export type SessionType = "online" | "offline" | "both";

export type PractitionerStatus = "pending" | "active" | "suspended" | "rejected";

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
  /** Used in the public URL, e.g. "dr-ali" -> /dr-ali */
  slug: string;
  fullName: string;
  professionalTitle: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  /** One-line summary shown under the name on the public profile hero. */
  shortBio?: string;
  bio: string;
  /** A short personal note shown in a highlighted section at the end of the public profile. */
  noteForClients?: string;
  specializations: string[];
  /** The kinds of sessions/services offered, e.g. "Individual Therapy", "Couples Counselling". */
  services: string[];
  experienceYears: number;
  education: string[];
  /** "Role, Organization, Years" — same free-form shape as `education`. */
  workExperience?: string[];
  certifications: string[];
  languages: string[];
  sessionType: SessionType;
  /** One general fee range, independent of session mode (0 = not set). */
  feeRange: { currency: string; min: number; max: number };
  /** Where in-person sessions are held (clinic, hospital or city). Only set for on-site / both. */
  location?: string;
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
}
