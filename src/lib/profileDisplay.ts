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
