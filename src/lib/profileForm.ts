import { resolveCurrency } from "@/lib/currencies";
import { SOCIAL_PLATFORMS } from "@/lib/social";
import { DEFAULT_COLOR_THEME, isColorThemeId } from "@/lib/themes";
import { safeHttpUrl } from "@/lib/url";
import type { ContactMethod, Practitioner, SessionType, SocialLink } from "@/types/practitioner";

/** Generous limits that still stop someone storing megabytes in a profile field. */
export const PROFILE_LIMITS = { name: 120, title: 120, shortBio: 300, bio: 5000, item: 200, items: 30, location: 160, currency: 6, years: 80 };

const SESSION_TYPES: SessionType[] = ["online", "offline", "both"];

const clip = (value: FormDataEntryValue | null, max: number) => value?.toString().trim().slice(0, max) ?? "";

function stringList(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((value) => value.toString().trim().slice(0, PROFILE_LIMITS.item))
    .filter(Boolean)
    .slice(0, PROFILE_LIMITS.items);
}

/**
 * What the profile editor's form says about the public profile, tidied and limited the way it is when saved.
 * `currentCurrency` is the one already saved: a missing or odd currency never resets it.
 */
export function parseProfileForm(formData: FormData, currentCurrency: string): Partial<Omit<Practitioner, "slug">> {
  const socialLinks: SocialLink[] = SOCIAL_PLATFORMS.flatMap(({ platform }) => {
    const url = safeHttpUrl(formData.get(`social_${platform}`)?.toString());
    return url ? [{ platform, url }] : [];
  });

  const contactLabels = formData.getAll("contactLabel").map((v) => v.toString());
  const contactValues = formData.getAll("contactValue").map((v) => v.toString());
  const contactPublic = formData.getAll("contactPublic").map((v) => v.toString());
  const contactMethods: ContactMethod[] = contactLabels
    .map((label, i) => ({
      label: label.trim().slice(0, 40),
      value: (contactValues[i] ?? "").trim().slice(0, 200),
      isPublic: contactPublic[i] === "true",
    }))
    // Empty values are kept, so clearing a field doesn't fall back to the account's email/phone.
    .filter((c) => c.label)
    .slice(0, 10);

  const feeMin = Math.max(0, Number(formData.get("feeMin")) || 0);
  const feeMax = Math.max(0, Number(formData.get("feeMax")) || 0);

  const requestedTheme = formData.get("colorTheme")?.toString();
  const colorTheme = isColorThemeId(requestedTheme) ? requestedTheme : DEFAULT_COLOR_THEME;

  return {
    fullName: clip(formData.get("fullName"), PROFILE_LIMITS.name),
    professionalTitle: clip(formData.get("professionalTitle"), PROFILE_LIMITS.title),
    shortBio: clip(formData.get("shortBio"), PROFILE_LIMITS.shortBio) || undefined,
    bio: clip(formData.get("bio"), PROFILE_LIMITS.bio),
    specializations: stringList(formData, "specializations"),
    languages: stringList(formData, "languages"),
    services: stringList(formData, "services"),
    experienceYears: Math.min(PROFILE_LIMITS.years, Math.max(0, Math.trunc(Number(formData.get("experienceYears")) || 0))),
    education: stringList(formData, "education"),
    workExperience: stringList(formData, "workExperience"),
    sessionType: SESSION_TYPES.includes(formData.get("sessionType") as SessionType) ? (formData.get("sessionType") as SessionType) : "both",
    feeRange: {
      currency: resolveCurrency(formData.get("feeCurrency"), currentCurrency),
      // Tolerate the two being entered the wrong way round.
      min: Math.min(feeMin, feeMax),
      max: Math.max(feeMin, feeMax),
    },
    location: clip(formData.get("location"), PROFILE_LIMITS.location) || undefined,
    socialLinks,
    websiteUrl: safeHttpUrl(formData.get("websiteUrl")?.toString()),
    contactMethods,
    colorTheme,
  };
}
