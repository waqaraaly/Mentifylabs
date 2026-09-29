import type { ContactMethod, Practitioner } from "@/types/practitioner";
import type { ColorThemeId } from "@/lib/themes";
import { isSupportedSocialLink } from "@/lib/social";
import { all, first, run } from "@/lib/db";
import { requireRole } from "@/lib/session";

// Slugs a practitioner may not claim, since practitioners are served at the
// root URL (/[username]) alongside app routes like /dashboard, /admin or /login.
export const RESERVED_SLUGS = [
  "dashboard",
  "admin",
  "sessions",
  "manage-slots",
  "settings",
  "login",
  "signup",
  "forgot-password",
  "reset-password",
  "media",
  "documents",
  "api",
  "about",
  "contact",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}

interface PractitionerRow {
  id: string;
  slug: string;
  full_name: string;
  professional_title: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  short_bio: string | null;
  bio: string;
  specializations: string;
  services: string;
  experience_years: number;
  education: string;
  work_experience: string | null;
  certifications: string;
  languages: string;
  session_type: Practitioner["sessionType"];
  fee_currency: string;
  fee_min: number;
  fee_max: number;
  location: string | null;
  social_links: string;
  website_url: string | null;
  contact_methods: string;
  color_theme: ColorThemeId | null;
  status: Practitioner["status"];
  profile_status: Practitioner["profileStatus"];
  creation_method: Practitioner["creationMethod"];
  date_joined: string;
  last_sign_in: string | null;
  approved_on: string | null;
  suspended_on: string | null;
  rejection_note: string | null;
  verification_status: Practitioner["verificationStatus"];
  verification_submitted_at: string | null;
  verified_on: string | null;
  verification_note: string | null;
  verification_prompt_seen_at: string | null;
}

const opt = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
const json = <T>(v: string): T => JSON.parse(v) as T;

function toPractitioner(r: PractitionerRow): Practitioner {
  return {
    slug: r.slug,
    fullName: r.full_name,
    professionalTitle: r.professional_title,
    email: r.email,
    phone: opt(r.phone),
    photoUrl: opt(r.photo_url),
    shortBio: opt(r.short_bio),
    bio: r.bio,
    specializations: json(r.specializations),
    services: json(r.services),
    experienceYears: r.experience_years,
    education: json(r.education),
    workExperience: r.work_experience === null ? undefined : json(r.work_experience),
    certifications: json(r.certifications),
    languages: json(r.languages),
    sessionType: r.session_type,
    feeRange: { currency: r.fee_currency, min: r.fee_min, max: r.fee_max },
    location: opt(r.location),
    socialLinks: json(r.social_links),
    websiteUrl: opt(r.website_url),
    contactMethods: json(r.contact_methods),
    colorTheme: opt(r.color_theme),
    status: r.status,
    profileStatus: r.profile_status,
    creationMethod: r.creation_method,
    dateJoined: r.date_joined,
    lastSignIn: opt(r.last_sign_in),
    approvedOn: opt(r.approved_on),
    suspendedOn: opt(r.suspended_on),
    rejectionNote: opt(r.rejection_note),
    verificationStatus: r.verification_status,
    verificationSubmittedAt: opt(r.verification_submitted_at),
    verifiedOn: opt(r.verified_on),
    verificationNote: opt(r.verification_note),
    verificationPromptSeenAt: opt(r.verification_prompt_seen_at),
  };
}

/** Column for each field; JSON columns are marked so their values are serialized on write. */
const COLUMN: Record<Exclude<keyof Practitioner, "slug" | "feeRange">, [string, "json"?]> = {
  fullName: ["full_name"],
  professionalTitle: ["professional_title"],
  email: ["email"],
  phone: ["phone"],
  photoUrl: ["photo_url"],
  shortBio: ["short_bio"],
  bio: ["bio"],
  specializations: ["specializations", "json"],
  services: ["services", "json"],
  experienceYears: ["experience_years"],
  education: ["education", "json"],
  workExperience: ["work_experience", "json"],
  certifications: ["certifications", "json"],
  languages: ["languages", "json"],
  sessionType: ["session_type"],
  location: ["location"],
  socialLinks: ["social_links", "json"],
  websiteUrl: ["website_url"],
  contactMethods: ["contact_methods", "json"],
  colorTheme: ["color_theme"],
  status: ["status"],
  profileStatus: ["profile_status"],
  creationMethod: ["creation_method"],
  dateJoined: ["date_joined"],
  lastSignIn: ["last_sign_in"],
  approvedOn: ["approved_on"],
  suspendedOn: ["suspended_on"],
  rejectionNote: ["rejection_note"],
  verificationStatus: ["verification_status"],
  verificationSubmittedAt: ["verification_submitted_at"],
  verifiedOn: ["verified_on"],
  verificationNote: ["verification_note"],
  verificationPromptSeenAt: ["verification_prompt_seen_at"],
};

type ColumnValue = string | number | null;

/** Maps a partial Practitioner to column values. A key that is present but undefined clears the column. */
function toColumns(updates: Partial<Omit<Practitioner, "slug">>): Record<string, ColumnValue> {
  const cols: Record<string, ColumnValue> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (key === "feeRange") {
      const fee = value as Practitioner["feeRange"] | undefined;
      if (fee) Object.assign(cols, { fee_currency: fee.currency, fee_min: fee.min, fee_max: fee.max });
      continue;
    }
    const spec = COLUMN[key as keyof typeof COLUMN];
    if (!spec) continue;
    const [column, kind] = spec;
    cols[column] = value === undefined || value === null ? null : kind === "json" ? JSON.stringify(value) : (value as ColumnValue);
  }
  return cols;
}

async function updateBySlug(slug: string, cols: Record<string, ColumnValue>): Promise<Practitioner | null> {
  const names = Object.keys(cols);
  if (names.length === 0) return getPractitionerBySlug(slug);
  const row = await first<PractitionerRow>(
    `UPDATE practitioners SET ${names.map((n) => `${n} = ?`).join(", ")} WHERE slug = ? RETURNING *`,
    ...names.map((n) => cols[n]),
    slug,
  );
  return row ? toPractitioner(row) : null;
}

const today = () => new Date().toISOString().slice(0, 10);

export async function getAllPractitionerSlugs(): Promise<string[]> {
  const rows = await all<{ slug: string }>("SELECT slug FROM practitioners ORDER BY created_at");
  return rows.map((r) => r.slug);
}

export async function getPractitionerBySlug(slug: string): Promise<Practitioner | null> {
  if (isReservedSlug(slug)) return null;
  const row = await first<PractitionerRow>("SELECT * FROM practitioners WHERE slug = ?", slug);
  return row ? toPractitioner(row) : null;
}

/** The signed-in practitioner. Redirects to /login when nobody (or an admin) is signed in. */
export async function getCurrentPractitioner(): Promise<Practitioner> {
  const user = await requireRole("practitioner");
  const row = await first<PractitionerRow>("SELECT * FROM practitioners WHERE id = ?", user.practitionerId);
  if (!row) throw new Error("This account's practitioner record no longer exists.");
  return toPractitioner(row);
}

/**
 * For server actions: the signed-in practitioner's slug, after checking that the slug the
 * browser sent is theirs. Stops one practitioner from acting on another's data.
 */
export async function requireOwnSlug(slug: string | undefined | null): Promise<string> {
  const me = await getCurrentPractitioner();
  if (slug !== me.slug) throw new Error("You can only change your own data.");
  return me.slug;
}

export async function updatePractitionerProfile(
  slug: string,
  updates: Partial<Omit<Practitioner, "slug">>,
): Promise<Practitioner | null> {
  return updateBySlug(slug, toColumns(updates));
}

// ---- Super Admin ----

export async function getAllPractitioners(): Promise<Practitioner[]> {
  const rows = await all<PractitionerRow>("SELECT * FROM practitioners ORDER BY created_at");
  return rows.map(toPractitioner);
}

export async function setPractitionerStatus(
  slug: string,
  status: Practitioner["status"],
): Promise<Practitioner | null> {
  return updateBySlug(slug, { status });
}

export async function approvePractitioner(slug: string): Promise<Practitioner | null> {
  const current = await getPractitionerBySlug(slug);
  if (!current) return null;
  return updateBySlug(slug, {
    status: "active",
    approved_on: today(),
    rejection_note: null,
    ...(current.profileStatus === "draft" ? { profile_status: "in_review" } : {}),
  });
}

export async function rejectPractitioner(slug: string, note?: string): Promise<Practitioner | null> {
  return updateBySlug(slug, { status: "rejected", rejection_note: note ?? null });
}

export async function suspendPractitioner(slug: string): Promise<Practitioner | null> {
  return updateBySlug(slug, { status: "suspended", suspended_on: today(), profile_status: "suspended" });
}

export async function reactivatePractitioner(slug: string): Promise<Practitioner | null> {
  // Public profile needs a manual re-publish after reactivation.
  return updateBySlug(slug, { status: "active", suspended_on: null, profile_status: "hidden" });
}

/** Approve & publish the public profile — independent from account status. */
export async function approveProfile(slug: string): Promise<Practitioner | null> {
  const current = await getPractitionerBySlug(slug);
  if (!current) return null;
  return updateBySlug(slug, {
    profile_status: "published",
    rejection_note: null,
    ...(current.status === "pending" ? { status: "active", approved_on: today() } : {}),
  });
}

export async function hideProfile(slug: string): Promise<Practitioner | null> {
  return updateBySlug(slug, { profile_status: "hidden" });
}

/** Send the profile back for edits with feedback — doesn't touch account status. */
export async function rejectProfile(slug: string, note: string): Promise<Practitioner | null> {
  return updateBySlug(slug, { profile_status: "incomplete", rejection_note: note });
}

// ---- Credential verification ----

/** Marks the first-login setup popup as seen, so it only shows once. */
export async function dismissVerificationPrompt(slug: string): Promise<void> {
  await updateBySlug(slug, { verification_prompt_seen_at: new Date().toISOString() });
}

/** Submitting a verification document moves the request into Super Admin's review queue. */
export async function submitVerification(slug: string): Promise<Practitioner | null> {
  return updateBySlug(slug, {
    verification_status: "pending",
    verification_submitted_at: new Date().toISOString(),
    verification_note: null,
  });
}

export async function approveVerification(slug: string): Promise<Practitioner | null> {
  return updateBySlug(slug, { verification_status: "verified", verified_on: today(), verification_note: null });
}

/** Sends the request back with feedback; the practitioner can resubmit. */
export async function rejectVerification(slug: string, note: string): Promise<Practitioner | null> {
  return updateBySlug(slug, {
    verification_status: "unverified",
    verification_submitted_at: null,
    verification_note: note,
  });
}

/**
 * Renames the slug. Every table references practitioners(slug) with ON UPDATE CASCADE,
 * so appointments, slots, availability, documents and feature access follow automatically.
 */
export async function updatePractitionerSlug(
  currentSlug: string,
  nextSlug: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalized = nextSlug.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return { ok: false, message: "Slug can only contain lowercase letters, numbers, and hyphens." };
  }
  if (isReservedSlug(normalized)) {
    return { ok: false, message: "That slug is reserved and can't be used." };
  }
  if (normalized === currentSlug) return { ok: true };
  if (await first("SELECT 1 FROM practitioners WHERE slug = ?", normalized)) {
    return { ok: false, message: "That slug is already taken." };
  }
  const changed = await run("UPDATE practitioners SET slug = ? WHERE slug = ?", normalized, currentSlug);
  if (changed === 0) return { ok: false, message: "Practitioner not found." };
  return { ok: true };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A free, non-reserved slug based on a name ("ayesha-batool", then "ayesha-batool-2", …); "" if none can be made. */
export async function uniqueSlugFor(name: string): Promise<string> {
  const baseSlug = slugify(name);
  if (!baseSlug) return "";
  const existing = new Set(await getAllPractitionerSlugs());
  let slug = baseSlug;
  let suffix = 2;
  while (isReservedSlug(slug) || existing.has(slug)) slug = `${baseSlug}-${suffix++}`;
  return slug;
}

export async function createPractitionerManually(input: {
  fullName: string;
  professionalTitle: string;
  email: string;
  slug?: string;
  skipVerification?: boolean;
}): Promise<{ ok: true; practitioner: Practitioner } | { ok: false; message: string }> {
  const normalizedSlug = await uniqueSlugFor(input.slug || input.fullName);
  if (!normalizedSlug) {
    return { ok: false, message: "Couldn't derive a slug from that name." };
  }

  const day = today();
  const skip = input.skipVerification ?? true;
  // The public Email/Phone rows are pre-filled from the account once, at creation.
  const contactMethods: ContactMethod[] = CONTACT_DETAIL_LABELS.map((label) => ({
    label,
    value: label === "Email" ? input.email : "",
    isPublic: true,
  }));
  const row = await first<PractitionerRow>(
    `INSERT INTO practitioners
       (slug, full_name, professional_title, email, session_type, contact_methods,
        status, profile_status, creation_method, date_joined, approved_on)
     VALUES (?, ?, ?, ?, 'both', ?, ?, ?, 'super_admin', ?, ?)
     RETURNING *`,
    normalizedSlug,
    input.fullName,
    input.professionalTitle || "Practitioner",
    input.email,
    JSON.stringify(contactMethods),
    // Manually added by Super Admin.
    skip ? "active" : "pending",
    skip ? "hidden" : "draft",
    day,
    skip ? day : null,
  );
  return { ok: true, practitioner: toPractitioner(row!) };
}

// ---- Public visibility ----

/** A profile is live to the public only when the account is active and Super Admin has published it. */
export function isPubliclyVisible(p: Practitioner): boolean {
  return p.status === "active" && p.profileStatus === "published";
}

export const CONTACT_DETAIL_LABELS = ["Email", "Phone"] as const;

/** The profile's public Email and Phone contact details (always both rows, possibly empty). */
export function getContactDetails(p: Practitioner): ContactMethod[] {
  return CONTACT_DETAIL_LABELS.map(
    (label) => p.contactMethods.find((c) => c.label === label) ?? { label, value: "", isPublic: false },
  );
}

export async function getPublicPractitionerBySlug(slug: string): Promise<Practitioner | null> {
  const practitioner = await getPractitionerBySlug(slug);
  if (!practitioner || !isPubliclyVisible(practitioner)) return null;
  // Private contact details must never leave the server: the public page hands
  // this object to client components, which serializes it into the page source.
  // The account email/phone are blanked too, or a detail marked Private could leak through them.
  return {
    ...practitioner,
    email: "",
    phone: undefined,
    // Only the platforms the portal can edit, so a stale link never lingers.
    socialLinks: practitioner.socialLinks.filter(isSupportedSocialLink),
    contactMethods: getContactDetails(practitioner).filter((c) => c.isPublic && c.value),
  };
}

export async function getPublicPractitionerSlugs(): Promise<string[]> {
  const rows = await all<{ slug: string }>(
    "SELECT slug FROM practitioners WHERE status = 'active' AND profile_status = 'published' ORDER BY created_at",
  );
  return rows.map((r) => r.slug);
}
