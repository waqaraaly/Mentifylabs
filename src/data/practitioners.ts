import { isLive } from "@/lib/practitionerState";
import { DEFAULT_REJECTION_REASON } from "@/lib/verification";
import type { ContactMethod, Practitioner } from "@/types/practitioner";
import type { ColorThemeId } from "@/lib/themes";
import { isSupportedSocialLink } from "@/lib/social";
import { all, first, run } from "@/lib/db";
import { photoKeyFromUrl } from "@/lib/storage";
import { requireRole } from "@/lib/session";
import { publishBlockReason } from "@/lib/verification";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { STALE_HANDLE_DAYS, makePlaceholderSlug, validateHandleFormat } from "@/lib/handle";

// Slugs a practitioner may not claim, since practitioners are served at the
// root URL (/[username]) alongside app routes like /dashboard, /admin or /login.
export const RESERVED_SLUGS = [
  "dashboard",
  "admin",
  "sessions",
  "manage-slots",
  "settings",
  "preview",
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
  slug_chosen_at: string | null;
  full_name: string;
  professional_title: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  short_bio: string | null;
  bio: string;
  note_for_clients: string | null;
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
  email_unconfirmed?: number | null;
  has_login?: number | null;
  email_confirmed_at?: string | null;
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
  onboarded_at: string | null;
  accepting_bookings: number;
}

const opt = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
const json = <T>(v: string): T => JSON.parse(v) as T;

function toPractitioner(r: PractitionerRow): Practitioner {
  return {
    slug: r.slug,
    slugChosenAt: opt(r.slug_chosen_at),
    fullName: r.full_name,
    professionalTitle: r.professional_title,
    email: r.email,
    phone: opt(r.phone),
    photoUrl: opt(r.photo_url),
    shortBio: opt(r.short_bio),
    bio: r.bio,
    noteForClients: opt(r.note_for_clients),
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
    onboardedAt: opt(r.onboarded_at),
    acceptingBookings: r.accepting_bookings !== 0,
  };
}

/** Column for each field; JSON columns are marked so their values are serialized on write. */
const COLUMN: Record<Exclude<keyof Practitioner, "slug" | "slugChosenAt" | "feeRange" | "emailUnconfirmed" | "hasLogin" | "emailConfirmedAt">, [string, "json"?]> = {
  fullName: ["full_name"],
  professionalTitle: ["professional_title"],
  email: ["email"],
  phone: ["phone"],
  photoUrl: ["photo_url"],
  shortBio: ["short_bio"],
  bio: ["bio"],
  noteForClients: ["note_for_clients"],
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
  onboardedAt: ["onboarded_at"],
  acceptingBookings: ["accepting_bookings"],
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
    cols[column] =
      value === undefined || value === null
        ? null
        : kind === "json"
          ? JSON.stringify(value)
          : typeof value === "boolean"
            ? Number(value)
            : (value as ColumnValue);
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
  const rows = await all<PractitionerRow>(
    `SELECT p.*,
            EXISTS (SELECT 1 FROM users u WHERE u.practitioner_id = p.id AND u.email_verified_at IS NULL) AS email_unconfirmed,
            EXISTS (SELECT 1 FROM users u WHERE u.practitioner_id = p.id) AS has_login,
            (SELECT u.email_verified_at FROM users u WHERE u.practitioner_id = p.id LIMIT 1) AS email_confirmed_at
       FROM practitioners p ORDER BY p.created_at`,
  );
  return rows.map((r) => ({ ...toPractitioner(r), emailUnconfirmed: !!r.email_unconfirmed, hasLogin: !!r.has_login, emailConfirmedAt: r.email_confirmed_at ?? undefined }));
}

export async function setPractitionerStatus(
  slug: string,
  status: Practitioner["status"],
): Promise<Practitioner | null> {
  return updateBySlug(slug, { status });
}

export async function suspendPractitioner(slug: string): Promise<Practitioner | null> {
  return updateBySlug(slug, { status: "suspended", suspended_on: today(), profile_status: "suspended" });
}

export async function reactivatePractitioner(slug: string, goLive = false): Promise<Practitioner | null> {
  // By default the profile stays offline after reactivation and the practitioner publishes it again themselves.
  // Super Admin can restore it straight to live instead, but only for verified credentials (the same rule as publishing).
  const current = goLive ? await getPractitionerBySlug(slug) : null;
  const live = goLive && current?.verificationStatus === "verified";
  return updateBySlug(slug, { status: "active", suspended_on: null, profile_status: live ? "published" : "draft" });
}

/**
 * Super Admin's one approval: marks the credentials verified. It never publishes. Going live is the practitioner's own step (publishOwnProfile).
 */
export async function approveSubmission(slug: string): Promise<Practitioner | null> {
  const current = await getPractitionerBySlug(slug);
  if (!current) return null;
  return updateBySlug(slug, {
    verification_status: "verified",
    verified_on: today(),
    verification_note: null,
  });
}

export async function hideProfile(slug: string): Promise<Practitioner | null> {
  return updateBySlug(slug, { profile_status: "hidden" });
}

/**
 * The practitioner takes their own profile live. Only possible once their credentials are verified
 * (see publishBlockReason), so pending, unverified and sent-back practitioners can't.
 */
export async function publishOwnProfile(slug: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const current = await getPractitionerBySlug(slug);
  if (!current) return { ok: false, message: "Profile not found." };
  const blocked = publishBlockReason(current);
  if (blocked) return { ok: false, message: blocked };
  await updateBySlug(slug, { profile_status: "published", rejection_note: null });
  return { ok: true };
}

/** The practitioner takes their own profile offline again. It goes back to draft, so they can republish whenever they like. */
export async function unpublishOwnProfile(slug: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const current = await getPractitionerBySlug(slug);
  if (!current) return { ok: false, message: "Profile not found." };
  if (current.profileStatus !== "published") return { ok: false, message: "Your profile isn't published." };
  await updateBySlug(slug, { profile_status: "draft" });
  return { ok: true };
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

/** Ends the guided /onboarding flow (finished or skipped), unlocking the dashboard. */
export async function completeOnboarding(slug: string): Promise<void> {
  await updateBySlug(slug, { onboarded_at: new Date().toISOString() });
}

/** Submitting a verification document moves the request into Super Admin's review queue. */
export async function submitVerification(slug: string): Promise<Practitioner | null> {
  return updateBySlug(slug, {
    verification_status: "pending",
    verification_submitted_at: new Date().toISOString(),
    verification_note: null,
  });
}

/** Sends the request back with feedback; the practitioner can resubmit. */
export async function rejectVerification(slug: string, note: string): Promise<Practitioner | null> {
  // The reason is optional for the admin, but a saved reason is what marks the submission as rejected, so it is never blank.
  return updateBySlug(slug, {
    verification_status: "unverified",
    verification_submitted_at: null,
    verification_note: note.trim() || DEFAULT_REJECTION_REASON,
  });
}

/**
 * Deletes a practitioner and everything that hangs off them: their sign-in account and sessions, appointments, slots,
 * availability, documents, review history and profile views all go with the record (the database cascades). It refuses
 * while they still have upcoming appointments, since those clients would be left with nobody. Returns the stored files
 * (photo and documents) so the caller can remove them from storage too.
 */
export async function deletePractitionerCompletely(
  slug: string,
): Promise<{ ok: true; fileKeys: string[] } | { ok: false; message: string }> {
  const current = await getPractitionerBySlug(slug);
  if (!current) return { ok: false, message: "Practitioner not found." };

  const upcoming = await first<{ n: number }>(
    "SELECT count(*) AS n FROM appointments WHERE practitioner_slug = ? AND status IN ('pending', 'confirmed') AND date >= date('now')",
    slug,
  );
  if ((upcoming?.n ?? 0) > 0) {
    return {
      ok: false,
      message: `${current.fullName} has ${upcoming!.n} upcoming ${upcoming!.n === 1 ? "appointment" : "appointments"}. Those clients would be left without a practitioner. Suspend the account instead, and delete it once they are finished.`,
    };
  }

  const fileKeys = (
    await all<{ storage_key: string }>(
      "SELECT storage_key FROM practitioner_documents WHERE practitioner_slug = ? AND storage_key IS NOT NULL",
      slug,
    )
  ).map((r) => r.storage_key);
  const photo = photoKeyFromUrl(current.photoUrl);
  if (photo) fileKeys.push(photo);

  await run("DELETE FROM practitioners WHERE slug = ?", slug);
  return { ok: true, fileKeys };
}

/**
 * Renames the slug. Every table references practitioners(slug) with ON UPDATE CASCADE,
 * so appointments, slots, availability, and documents follow automatically.
 */
/** Why a handle can't be used by this practitioner, or null if it can. Also frees a handle an unverified account has sat on too long. */
export async function handleProblem(handle: string, ownSlug: string): Promise<{ ok: true; handle: string } | { ok: false; message: string }> {
  const format = validateHandleFormat(handle);
  if (!format.ok) return format;
  const next = format.handle;
  if (isReservedSlug(next)) return { ok: false, message: "That link is reserved. Choose another." };
  if (next === ownSlug) return { ok: true, handle: next };
  await releaseStaleHandle(next);
  if (await first("SELECT 1 FROM practitioners WHERE slug = ?", next)) return { ok: false, message: "That link is already taken." };
  return { ok: true, handle: next };
}

/**
 * A chosen handle held by an account that never verified, never went live, and is older than STALE_HANDLE_DAYS goes back
 * to being free. The account keeps everything else and gets a placeholder until its owner chooses again.
 */
async function releaseStaleHandle(handle: string): Promise<void> {
  const holder = await first<{ slug: string }>(
    `SELECT slug FROM practitioners
      WHERE slug = ? AND slug_chosen_at IS NOT NULL AND verification_status <> 'verified'
        AND profile_status <> 'published' AND date_joined < date('now', ?)`,
    handle,
    `-${STALE_HANDLE_DAYS} days`,
  );
  if (holder) await run("UPDATE practitioners SET slug = ?, slug_chosen_at = NULL WHERE slug = ?", await freePlaceholderSlug(), holder.slug);
}

/** Sets or changes a profile link. The old one stops working at once: nothing redirects and nothing is held back. */
export async function updatePractitionerSlug(
  currentSlug: string,
  nextSlug: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const checked = await handleProblem(nextSlug, currentSlug);
  if (!checked.ok) return checked;
  const now = new Date().toISOString();
  const changed = await run(
    "UPDATE practitioners SET slug = ?, slug_chosen_at = COALESCE(slug_chosen_at, ?) WHERE slug = ?",
    checked.handle,
    now,
    currentSlug,
  );
  if (changed === 0) return { ok: false, message: "Practitioner not found." };
  return { ok: true };
}

/** A hidden stand-in slug that nobody else has. */
export async function freePlaceholderSlug(): Promise<string> {
  for (;;) {
    const slug = makePlaceholderSlug();
    if (!(await first("SELECT 1 FROM practitioners WHERE slug = ?", slug))) return slug;
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A free handle based on the person's name to offer as a starting point, or "" if the name gives no usable one. They still choose. */
export async function suggestHandle(name: string): Promise<string> {
  const candidate = slugify(name).slice(0, 30).replace(/-+$/, "");
  if (!candidate) return "";
  const checked = await handleProblem(candidate, "");
  return checked.ok ? checked.handle : "";
}

export async function createPractitionerManually(input: {
  fullName: string;
  professionalTitle: string;
  email: string;
  skipVerification?: boolean;
}): Promise<{ ok: true; practitioner: Practitioner } | { ok: false; message: string }> {
  // No profile link yet: the practitioner chooses their own when they set up their account.
  const normalizedSlug = await freePlaceholderSlug();

  const day = today();
  const skip = input.skipVerification ?? true;
  // The public Email/Phone rows start empty. The sign-in email is never copied onto the profile.
  const contactMethods: ContactMethod[] = CONTACT_DETAIL_LABELS.map((label) => ({ label, value: "", isPublic: true }));
  const row = await first<PractitionerRow>(
    `INSERT INTO practitioners
       (slug, full_name, professional_title, email, session_type, contact_methods,
        status, profile_status, creation_method, date_joined, approved_on, verification_status, verified_on, fee_currency)
     VALUES (?, ?, ?, ?, 'both', ?, ?, ?, 'super_admin', ?, ?, ?, ?, ?)
     RETURNING *`,
    normalizedSlug,
    input.fullName,
    input.professionalTitle || "Practitioner",
    input.email,
    JSON.stringify(contactMethods),
    // Manually added by Super Admin. "Skip verification" means Super Admin vouches for them: they start active
    // and verified, so they can publish straight away. Either way the profile starts as a draft.
    "active",
    "draft",
    day,
    skip ? day : null,
    skip ? "verified" : "unverified",
    skip ? day : null,
    DEFAULT_CURRENCY,
  );
  return { ok: true, practitioner: toPractitioner(row!) };
}

// ---- Public visibility ----

/** A profile is live to the public only when the account is active, the credentials are verified, and the practitioner has published it. */
export function isPubliclyVisible(p: Practitioner): boolean {
  return isLive(p);
}

export const CONTACT_DETAIL_LABELS = ["Email", "Phone"] as const;

/** The profile's public Email and Phone contact details (always both rows, possibly empty). */
export function getContactDetails(p: Practitioner): ContactMethod[] {
  return CONTACT_DETAIL_LABELS.map(
    (label) => p.contactMethods.find((c) => c.label === label) ?? { label, value: "", isPublic: false },
  );
}

// Private contact details must never leave the server: the profile page hands
// this object to client components, which serializes it into the page source.
// The account email/phone are blanked too, or a detail marked Private could leak through them.
function sanitizeForProfilePage(practitioner: Practitioner): Practitioner {
  return {
    ...practitioner,
    email: "",
    phone: undefined,
    // Only the platforms the portal can edit, so a stale link never lingers.
    socialLinks: practitioner.socialLinks.filter(isSupportedSocialLink),
    contactMethods: getContactDetails(practitioner).filter((c) => c.isPublic && c.value),
  };
}

export async function getPublicPractitionerBySlug(slug: string): Promise<Practitioner | null> {
  const practitioner = await getPractitionerBySlug(slug);
  if (!practitioner || !isPubliclyVisible(practitioner)) return null;
  return sanitizeForProfilePage(practitioner);
}

/** The signed-in practitioner's own profile, sanitized the same way as the public page, regardless of publish state. */
export async function getOwnProfilePreview(slug: string): Promise<Practitioner | null> {
  const practitioner = await getPractitionerBySlug(slug);
  return practitioner ? sanitizeForProfilePage(practitioner) : null;
}

export async function getPublicPractitionerSlugs(): Promise<string[]> {
  const rows = await all<{ slug: string }>(
    "SELECT slug FROM practitioners WHERE status = 'active' AND profile_status = 'published' AND verification_status = 'verified' ORDER BY created_at",
  );
  return rows.map((r) => r.slug);
}
