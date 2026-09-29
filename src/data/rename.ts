import { updatePractitionerSlug } from "./practitioners";

/**
 * Renames a practitioner's slug. Appointments, slots, availability, documents and
 * feature access follow automatically through ON UPDATE CASCADE foreign keys.
 * Both the practitioner portal and Super Admin rename through here.
 */
export async function renamePractitionerSlug(
  currentSlug: string,
  nextSlug: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  return updatePractitionerSlug(currentSlug, nextSlug);
}
