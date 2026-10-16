import { contactHref } from "@/components/practitioner/ReachOutCard";
import { formatFeeAmounts, hasFeeRange } from "@/lib/fees";
import { bioOf, experienceYearsOf, headlineOf, languagesOf } from "@/lib/profileDisplay";
import type { SectionKey } from "@/lib/templates";
import { safeHttpUrl } from "@/lib/url";
import type { Practitioner } from "@/types/practitioner";
import type { Slot } from "@/types/slot";

export interface Entry {
  title: string;
  place: string;
  years: string;
}

export interface Stat {
  label: string;
  value: string;
}

export interface ProfileModel {
  practitioner: Practitioner;
  firstNames: string;
  lastName: string;
  initials: string;
  verified: boolean;
  title: string;
  headline?: string;
  /** The bio split into paragraphs. */
  paragraphs: string[];
  stats: Stat[];
  location?: string;
  languages: string[];
  expertise: string[];
  services: string[];
  education: Entry[];
  experience: Entry[];
  contacts: { label: string; value: string; href?: string }[];
  socials: { platform: Practitioner["socialLinks"][number]["platform"]; href: string }[];
  website?: string;
  hasContact: boolean;
  /** Where in the practitioner's own words they trained, newest first: "M.Phil Clinical Psychology, University of the Punjab". */
  qualification?: string;
  /** The ways to meet: "Online", "On-site". */
  formats: string[];
  /** The fee as entered, "PKR 6,000-9,000", or undefined when none was set. */
  fee?: string;
  /** Open times, already limited to formats the practitioner offers, for the availability panel. */
  slots: Slot[];
  /** True in the owner's private preview: nothing can be booked from it. */
  preview: boolean;
  /** False while the practitioner has paused new bookings. */
  accepting: boolean;
}

const MODE_LABEL: Record<Practitioner["sessionType"], string> = {
  online: "Online",
  offline: "On-site",
  both: "Online and on-site",
};

function parseEntry(raw: string): Entry & { start: number } {
  const [title = "", place = "", years = ""] = raw.split(",").map((part) => part.trim());
  return { title, place, years, start: Number(years.match(/\d{4}/)?.[0] ?? 0) };
}

/** Most recent first, the way a story of someone's work is usually told. Entries with no year keep the order they were written in. */
function newestFirst(list: string[] | undefined): Entry[] {
  return (list ?? [])
    .map(parseEntry)
    .filter((entry) => entry.title)
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => b.entry.start - a.entry.start || a.index - b.index)
    .map(({ entry: { title, place, years } }) => ({ title, place, years }));
}

/** Everything the templates draw, worked out once from the practitioner. Optional parts that were left empty stay empty. */
export function buildModel(practitioner: Practitioner, hidden: Set<SectionKey>, preview: boolean, slots: Slot[]): ProfileModel {
  const nameParts = practitioner.fullName.trim().split(/\s+/);
  const lastName = nameParts.length > 1 ? (nameParts.pop() ?? "") : "";
  const firstNames = nameParts.join(" ");

  const years = experienceYearsOf(practitioner);
  const fee = formatFeeAmounts(practitioner.feeRange);
  const stats: Stat[] = [];
  if (years !== undefined) stats.push({ label: "Experience", value: `${years} ${years === 1 ? "year" : "years"}` });
  stats.push({
    label: "Fee",
    value: fee ? `${hasFeeRange(practitioner.feeRange) && practitioner.feeRange.currency ? `${practitioner.feeRange.currency} ` : ""}${fee}` : "On request",
  });
  stats.push({ label: "Sessions", value: MODE_LABEL[practitioner.sessionType] });

  const bio = bioOf(practitioner);
  const contacts = practitioner.contactMethods
    .filter((c) => c.isPublic && c.value)
    .map((c) => ({ label: c.label, value: c.value, href: contactHref(c.value) }));
  const socials = practitioner.socialLinks.flatMap((link) => {
    const href = safeHttpUrl(link.url);
    return href ? [{ platform: link.platform, href }] : [];
  });
  const website = safeHttpUrl(practitioner.websiteUrl);
  const location = practitioner.sessionType === "online" ? undefined : practitioner.location;
  const languages = languagesOf(practitioner);

  const education = newestFirst(practitioner.education);
  const firstEducation = education[0];
  const feeText = fee ? `${hasFeeRange(practitioner.feeRange) && practitioner.feeRange.currency ? `${practitioner.feeRange.currency} ` : ""}${fee}` : undefined;

  return {
    practitioner,
    firstNames: lastName ? firstNames : practitioner.fullName.trim(),
    lastName,
    initials: practitioner.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join(""),
    verified: practitioner.verificationStatus === "verified",
    title: practitioner.professionalTitle,
    headline: headlineOf(practitioner),
    paragraphs: bio ? bio.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [],
    stats: hidden.has("stats") ? [] : stats,
    location,
    languages,
    expertise: hidden.has("expertise") ? [] : practitioner.specializations.filter(Boolean),
    services: hidden.has("services") ? [] : practitioner.services.filter(Boolean),
    education: hidden.has("journey") ? [] : newestFirst(practitioner.education),
    experience: hidden.has("journey") ? [] : newestFirst(practitioner.workExperience),
    contacts,
    socials,
    website,
    hasContact: contacts.length > 0 || Boolean(location) || languages.length > 0 || socials.length > 0 || Boolean(website),
    qualification: firstEducation ? [firstEducation.title, firstEducation.place].filter(Boolean).join(", ") : undefined,
    formats: hidden.has("stats") ? [] : practitioner.sessionType === "both" ? ["Online", "On-site"] : [MODE_LABEL[practitioner.sessionType]],
    fee: hidden.has("stats") ? undefined : feeText,
    slots,
    preview,
    accepting: practitioner.acceptingBookings,
  };
}
