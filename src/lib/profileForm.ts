import { resolveCurrency } from "@/lib/currencies";
import { cleanEntryYears } from "@/lib/years";
import { SOCIAL_PLATFORMS } from "@/lib/social";
import { DEFAULT_COLOR_THEME, isColorThemeId } from "@/lib/themes";
import { cleanStyle, isLayoutId, type LayoutId, type ProfileStyle } from "@/lib/templates";
import { safeHttpUrl } from "@/lib/url";
import type { ContactMethod, Practitioner, SessionType, SocialLink } from "@/types/practitioner";

/** Generous limits that still stop someone storing megabytes in a profile field. */
export const PROFILE_LIMITS = { name: 120, title: 120, shortBio: 120, bio: 5000, item: 200, items: 30, location: 160, currency: 6, years: 80 };

const SESSION_TYPES: SessionType[] = ["online", "offline", "both"];

/** The most an older headline, saved before the limit was 120, can still hold. */
const LEGACY_HEADLINE_MAX = 300;

const clip = (value: FormDataEntryValue | null, max: number) => value?.toString().trim().slice(0, max) ?? "";

function stringList(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((value) => value.toString().trim().slice(0, PROFILE_LIMITS.item))
    .filter(Boolean)
    .slice(0, PROFILE_LIMITS.items);
}

/** A timeline list (education, work), with each entry's years made plain: only years, the current year for "Present". */
function entryList(formData: FormData, name: string): string[] {
  return stringList(formData, name).map((entry) => cleanEntryYears(entry));
}

/** The template and the changes made to it, from the Appearance fields. Shared with the private preview, which reads the same fields from the address. */
export function parseAppearance(get: (name: string) => string | undefined): { template: LayoutId | undefined; style: ProfileStyle | undefined } {
  const requested = get("template");
  const template = isLayoutId(requested) ? requested : undefined;
  const style = cleanStyle({ colorMode: get("colorMode"), scheme: get("scheme"), font: get("font"), headingFont: get("headingFont"), textFont: get("textFont"), shape: get("shape"), colors: { page: get("colorPage"), panels: get("colorPanels"), text: get("colorText"), accent: get("colorAccent"), frame: get("colorFrame"), ring: get("colorRing"), underline: get("colorUnderline"), hi: get("colorHi") } });
  return { template, style };
}

/**
 * What the profile editor's form says about the public profile, tidied and limited the way it is when saved.
 * `currentCurrency` is the one already saved: a missing or odd currency never resets it.
 */
export function parseProfileForm(formData: FormData, currentCurrency: string, currentHeadline = ""): Partial<Omit<Practitioner, "slug">> {
  // A headline saved before the limit existed is kept as it is while it is unchanged; a new or edited one is cut at the limit.
  const headline = formData.get("shortBio")?.toString().trim() ?? "";
  const keepsOld = headline !== "" && headline === currentHeadline.trim();
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

  const appearance = parseAppearance((name) => formData.get(name)?.toString());

  return {
    fullName: clip(formData.get("fullName"), PROFILE_LIMITS.name),
    professionalTitle: clip(formData.get("professionalTitle"), PROFILE_LIMITS.title),
    shortBio: (keepsOld ? headline.slice(0, LEGACY_HEADLINE_MAX) : headline.slice(0, PROFILE_LIMITS.shortBio)) || undefined,
    bio: clip(formData.get("bio"), PROFILE_LIMITS.bio),
    specializations: stringList(formData, "specializations"),
    languages: stringList(formData, "languages"),
    services: stringList(formData, "services"),
    experienceYears: Math.min(PROFILE_LIMITS.years, Math.max(0, Math.trunc(Number(formData.get("experienceYears")) || 0))),
    education: entryList(formData, "education"),
    workExperience: entryList(formData, "workExperience"),
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
    template: appearance.template,
    style: appearance.style,
  };
}
