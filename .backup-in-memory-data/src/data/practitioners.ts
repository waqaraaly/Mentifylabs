import type { ContactMethod, Practitioner } from "@/types/practitioner";
import { isSupportedSocialLink } from "@/lib/social";

/**
 * Temporary in-memory data source. Every function here is async on purpose:
 * once the Cloudflare D1 schema exists, these bodies swap for D1 queries
 * without touching any call site (pages, actions, sitemap all stay the same).
 */

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

const PRACTITIONERS: Practitioner[] = [
  {
    slug: "dr-ali",
    fullName: "Ayesha Batool",
    professionalTitle: "Clinical Psychologist",
    photoUrl: "/practitioners/dr-ali.jpg",
    colorTheme: "sage",
    email: "ayesha.batool@example.com",
    phone: "+92 300 1234567",
    bio: "Ayesha Batool is a clinical psychologist with over eight years of experience helping clients manage anxiety, depression, and relationship challenges. She takes an evidence-based, client-centered approach, drawing on CBT and mindfulness techniques tailored to each person's needs.",
    specializations: ["Anxiety", "Depression", "Relationship Counselling", "Stress Management"],
    services: ["Individual Therapy", "Couples Counselling", "Cognitive Behavioural Therapy (CBT)", "Mindfulness-Based Therapy"],
    experienceYears: 8,
    education: [
      "BSc (Hons) Psychology, University of the Punjab, 2010–2014",
      "MSc Clinical Psychology, University of the Punjab, 2014–2016",
      "M.Phil Clinical Psychology, University of the Punjab, 2016–2018",
      "Clinical Internship, Fountain House Lahore, 2018",
    ],
    workExperience: [
      "Clinical Psychologist, Mind & Wellness Clinic, 2022–Present",
      "Staff Psychologist, Fountain House Lahore, 2019–2022",
      "Associate Psychologist, Punjab Institute of Mental Health, 2018–2019",
    ],
    certifications: ["Certified CBT Practitioner", "Registered Clinical Psychologist"],
    languages: ["English", "Urdu"],
    sessionType: "both",
    feeRange: { currency: "PKR", min: 3000, max: 5000 },
    location: "Mind & Wellness Clinic, Gulberg III, Lahore",
    socialLinks: [
      { platform: "instagram", url: "https://instagram.com/dr.ayeshabatool" },
      { platform: "facebook", url: "https://facebook.com/dr.ayeshabatool" },
      { platform: "linkedin", url: "https://linkedin.com/in/ayeshabatool" },
    ],
    websiteUrl: "https://ayeshabatool.com",
    contactMethods: [
      { label: "Email", value: "ayesha.batool@example.com", isPublic: true },
      { label: "Phone", value: "+92 300 1234567", isPublic: true },
    ],
    status: "active",
    profileStatus: "published",
    creationMethod: "self",
    dateJoined: "2026-08-01",
    approvedOn: "2026-08-02",
    lastSignIn: "2026-09-15T17:40:00",
  },
  {
    slug: "hina-farooq",
    fullName: "Hina Farooq",
    professionalTitle: "Marriage & Family Therapist",
    email: "hina.farooq@example.com",
    phone: "+92 300 7654321",
    bio: "Hina Farooq specializes in couples and family therapy, helping partners and families rebuild communication and trust. She integrates systemic therapy with culturally-informed care for families across Pakistan.",
    specializations: ["Couples Therapy", "Family Conflict", "Premarital Counselling"],
    services: ["Couples Therapy", "Family Therapy", "Premarital Counselling"],
    experienceYears: 5,
    education: ["MS Family Therapy, Kinnaird College"],
    certifications: ["Certified Family Therapist"],
    languages: ["English", "Urdu", "Punjabi"],
    sessionType: "online",
    feeRange: { currency: "PKR", min: 2500, max: 4000 },
    location: "Islamabad, Pakistan",
    socialLinks: [{ platform: "instagram", url: "https://instagram.com/hina.farooq.therapy" }],
    websiteUrl: undefined,
    contactMethods: [],
    status: "pending",
    profileStatus: "in_review",
    creationMethod: "self",
    dateJoined: "2026-09-14",
  },
  {
    slug: "omar-siddiqui",
    fullName: "Omar Siddiqui",
    professionalTitle: "Psychiatrist",
    email: "omar.siddiqui@example.com",
    phone: "+92 300 1122334",
    bio: "Omar Siddiqui is a psychiatrist focused on mood disorders and medication management, working alongside therapists to provide integrated care.",
    specializations: ["Mood Disorders", "Medication Management", "Bipolar Disorder"],
    services: ["Psychiatric Assessment", "Medication Management", "Follow-up Consultations"],
    experienceYears: 12,
    education: ["MBBS, Dow Medical College", "FCPS Psychiatry"],
    certifications: ["Board Certified Psychiatrist"],
    languages: ["English", "Urdu"],
    sessionType: "offline",
    feeRange: { currency: "PKR", min: 5000, max: 8000 },
    location: "Karachi, Pakistan",
    socialLinks: [],
    websiteUrl: undefined,
    contactMethods: [],
    status: "suspended",
    profileStatus: "hidden",
    creationMethod: "self",
    dateJoined: "2026-06-10",
    approvedOn: "2026-06-12",
    lastSignIn: "2026-08-20T09:00:00",
    suspendedOn: "2026-08-22",
    rejectionNote: undefined,
  },
  {
    slug: "sara-malik",
    fullName: "Sara Malik",
    professionalTitle: "Counselling Psychologist",
    email: "sara.malik@example.com",
    phone: "+92 300 9988776",
    bio: "Sara Malik works with young adults navigating academic stress, self-esteem, and identity concerns, using a warm, strengths-based approach.",
    specializations: ["Academic Stress", "Self-Esteem", "Young Adults"],
    services: ["Individual Counselling", "Student Counselling"],
    experienceYears: 3,
    education: ["MSc Counselling Psychology, LUMS"],
    certifications: [],
    languages: ["English", "Urdu"],
    sessionType: "online",
    feeRange: { currency: "PKR", min: 2000, max: 3000 },
    location: "Lahore, Pakistan",
    socialLinks: [],
    websiteUrl: undefined,
    contactMethods: [],
    status: "active",
    profileStatus: "published",
    creationMethod: "super_admin",
    dateJoined: "2026-09-05",
    approvedOn: "2026-09-06",
    lastSignIn: "2026-09-10T12:00:00",
  },
  {
    slug: "bilal-anwar",
    fullName: "Bilal Anwar",
    professionalTitle: "Counsellor",
    email: "bilal.anwar@example.com",
    phone: "+92 300 5551212",
    bio: "",
    specializations: ["Career Counselling"],
    services: [],
    experienceYears: 2,
    education: ["PG Diploma in Counselling, AIOU"],
    certifications: [],
    languages: ["English", "Urdu"],
    sessionType: "online",
    feeRange: { currency: "PKR", min: 0, max: 0 },
    location: "Faisalabad, Pakistan",
    socialLinks: [],
    websiteUrl: undefined,
    contactMethods: [],
    status: "pending",
    profileStatus: "incomplete",
    creationMethod: "self",
    dateJoined: "2026-09-16",
  },
];

export async function getAllPractitionerSlugs(): Promise<string[]> {
  return PRACTITIONERS.map((p) => p.slug);
}

export async function getPractitionerBySlug(
  slug: string,
): Promise<Practitioner | null> {
  if (isReservedSlug(slug)) return null;
  return PRACTITIONERS.find((p) => p.slug === slug) ?? null;
}

// TODO: once auth exists, resolve this from the signed-in session instead.
// Every /dashboard page reads "the current practitioner" through here so
// wiring up real auth later is a one-function change.
export async function getCurrentPractitioner(): Promise<Practitioner> {
  return PRACTITIONERS[0];
}

export async function updatePractitionerProfile(
  slug: string,
  updates: Partial<Omit<Practitioner, "slug">>,
): Promise<Practitioner | null> {
  const practitioner = PRACTITIONERS.find((p) => p.slug === slug);
  if (!practitioner) return null;
  Object.assign(practitioner, updates);
  return practitioner;
}

// ---- Super Admin ----

export async function getAllPractitioners(): Promise<Practitioner[]> {
  return [...PRACTITIONERS];
}

export async function setPractitionerStatus(
  slug: string,
  status: Practitioner["status"],
): Promise<Practitioner | null> {
  const practitioner = PRACTITIONERS.find((p) => p.slug === slug);
  if (!practitioner) return null;
  practitioner.status = status;
  return practitioner;
}

export async function approvePractitioner(slug: string): Promise<Practitioner | null> {
  const practitioner = PRACTITIONERS.find((p) => p.slug === slug);
  if (!practitioner) return null;
  practitioner.status = "active";
  practitioner.approvedOn = new Date().toISOString().slice(0, 10);
  practitioner.rejectionNote = undefined;
  if (practitioner.profileStatus === "draft") practitioner.profileStatus = "in_review";
  return practitioner;
}

export async function rejectPractitioner(
  slug: string,
  note?: string,
): Promise<Practitioner | null> {
  const practitioner = PRACTITIONERS.find((p) => p.slug === slug);
  if (!practitioner) return null;
  practitioner.status = "rejected";
  practitioner.rejectionNote = note;
  return practitioner;
}

export async function suspendPractitioner(slug: string): Promise<Practitioner | null> {
  const practitioner = PRACTITIONERS.find((p) => p.slug === slug);
  if (!practitioner) return null;
  practitioner.status = "suspended";
  practitioner.suspendedOn = new Date().toISOString().slice(0, 10);
  practitioner.profileStatus = "suspended";
  return practitioner;
}

export async function reactivatePractitioner(slug: string): Promise<Practitioner | null> {
  const practitioner = PRACTITIONERS.find((p) => p.slug === slug);
  if (!practitioner) return null;
  practitioner.status = "active";
  practitioner.suspendedOn = undefined;
  // Public profile needs a manual re-publish after reactivation.
  practitioner.profileStatus = "hidden";
  return practitioner;
}

/** Approve & publish the public profile — independent from account status. */
export async function approveProfile(slug: string): Promise<Practitioner | null> {
  const practitioner = PRACTITIONERS.find((p) => p.slug === slug);
  if (!practitioner) return null;
  practitioner.profileStatus = "published";
  practitioner.rejectionNote = undefined;
  if (practitioner.status === "pending") {
    practitioner.status = "active";
    practitioner.approvedOn = new Date().toISOString().slice(0, 10);
  }
  return practitioner;
}

export async function hideProfile(slug: string): Promise<Practitioner | null> {
  const practitioner = PRACTITIONERS.find((p) => p.slug === slug);
  if (!practitioner) return null;
  practitioner.profileStatus = "hidden";
  return practitioner;
}

/** Send the profile back for edits with feedback — doesn't touch account status. */
export async function rejectProfile(slug: string, note: string): Promise<Practitioner | null> {
  const practitioner = PRACTITIONERS.find((p) => p.slug === slug);
  if (!practitioner) return null;
  practitioner.profileStatus = "incomplete";
  practitioner.rejectionNote = note;
  return practitioner;
}

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
  if (PRACTITIONERS.some((p) => p.slug === normalized && p.slug !== currentSlug)) {
    return { ok: false, message: "That slug is already taken." };
  }
  const practitioner = PRACTITIONERS.find((p) => p.slug === currentSlug);
  if (!practitioner) return { ok: false, message: "Practitioner not found." };
  practitioner.slug = normalized;
  return { ok: true };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createPractitionerManually(input: {
  fullName: string;
  professionalTitle: string;
  email: string;
  slug?: string;
  skipVerification?: boolean;
}): Promise<{ ok: true; practitioner: Practitioner } | { ok: false; message: string }> {
  const baseSlug = slugify(input.slug || input.fullName);
  if (!baseSlug) {
    return { ok: false, message: "Couldn't derive a slug from that name." };
  }
  let normalizedSlug = baseSlug;
  let suffix = 2;
  while (isReservedSlug(normalizedSlug) || PRACTITIONERS.some((p) => p.slug === normalizedSlug)) {
    normalizedSlug = `${baseSlug}-${suffix++}`;
  }

  const today = new Date().toISOString().slice(0, 10);
  const skip = input.skipVerification ?? true;
  const practitioner: Practitioner = {
    slug: normalizedSlug,
    fullName: input.fullName,
    professionalTitle: input.professionalTitle || "Practitioner",
    email: input.email,
    bio: "",
    specializations: [],
    services: [],
    experienceYears: 0,
    education: [],
    certifications: [],
    languages: [],
    sessionType: "both",
    feeRange: { currency: "PKR", min: 0, max: 0 },
    socialLinks: [],
    contactMethods: [],
    // Manually added by Super Admin.
    status: skip ? "active" : "pending",
    profileStatus: skip ? "hidden" : "draft",
    creationMethod: "super_admin",
    dateJoined: today,
    approvedOn: skip ? today : undefined,
  };
  practitioner.contactMethods = withDefaultContactRows(practitioner);
  PRACTITIONERS.push(practitioner);
  return { ok: true, practitioner };
}

// ---- Public visibility ----

/** A profile is live to the public only when the account is active and Super Admin has published it. */
export function isPubliclyVisible(p: Practitioner): boolean {
  return p.status === "active" && p.profileStatus === "published";
}

export const CONTACT_DETAIL_LABELS = ["Email", "Phone"] as const;

/**
 * The profile's public Email and Phone rows are their own values, separate from
 * the private account (Settings). They are pre-filled from the account exactly
 * once — when the practitioner record is created — and never follow it after.
 */
function withDefaultContactRows(p: Practitioner): ContactMethod[] {
  const defaults = { Email: p.email, Phone: p.phone ?? "" };
  return CONTACT_DETAIL_LABELS.map(
    (label) =>
      p.contactMethods.find((c) => c.label === label) ?? { label, value: defaults[label], isPublic: true },
  );
}

for (const p of PRACTITIONERS) p.contactMethods = withDefaultContactRows(p);

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
  return PRACTITIONERS.filter(isPubliclyVisible).map((p) => p.slug);
}
