import { formatFeeAmounts, hasFeeRange } from "@/lib/fees";
import type { Practitioner } from "@/types/practitioner";

/**
 * What the public profile shows for each optional field. The rule is the same for all of them: what the practitioner
 * entered is what is shown, and what they left empty is left out, never filled in with a stand-in.
 */

/** The long Bio, trimmed, or undefined when there is nothing to show. */
export const bioOf = (p: Pick<Practitioner, "bio">): string | undefined => p.bio.trim() || undefined;

/** The one-line headline under the name. Never replaced by text made up from other fields. */
export const headlineOf = (p: Pick<Practitioner, "shortBio">): string | undefined => p.shortBio?.trim() || undefined;

/** The languages they see clients in, trimmed, with blanks and repeats removed. Empty when none were added. */
export const languagesOf = (p: Pick<Practitioner, "languages">): string[] => {
  const seen = new Set<string>();
  return p.languages
    .map((language) => language.trim())
    .filter((language) => {
      const key = language.toLowerCase();
      if (!language || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

/** Years of experience, only when they gave a number. The field starts at 0, which means "not filled in", not "none". */
export const experienceYearsOf = (p: Pick<Practitioner, "experienceYears">): number | undefined =>
  p.experienceYears > 0 ? p.experienceYears : undefined;

/** How the ways of meeting are written wherever a profile shows them, so every layout says the same thing. */
export const SESSION_MODE_LABEL: Record<Practitioner["sessionType"], string> = {
  online: "Online",
  offline: "On-site",
  both: "Online and on-site",
};

/** "1 year", "6 years". */
export const yearsText = (years: number): string => `${years} ${years === 1 ? "year" : "years"}`;

/** The fee as entered, with its currency ("PKR 6,000-9,000"), or the same plain words every layout uses when none was set. */
export const FEE_ON_REQUEST = "On request";
export const feeOf = (p: Pick<Practitioner, "feeRange">): string | undefined => {
  const amounts = formatFeeAmounts(p.feeRange);
  if (!amounts) return undefined;
  return `${hasFeeRange(p.feeRange) && p.feeRange.currency ? `${p.feeRange.currency} ` : ""}${amounts}`;
};
