import { updatePractitionerSlug } from "./practitioners";
import { renameAppointmentSlug } from "./appointments";
import { renameSlotSlug } from "./slots";
import { renameAvailabilitySlug } from "./availability";
import { renameDocumentSlug } from "./documents";
import { renameFeatureSlug } from "./features";

/**
 * Renames a practitioner's slug and carries every record keyed by it (appointments, slots,
 * availability, documents, feature access) across, so neither portal loses the practitioner's data.
 * Both the practitioner portal and Super Admin rename through here.
 */
export async function renamePractitionerSlug(
  currentSlug: string,
  nextSlug: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const result = await updatePractitionerSlug(currentSlug, nextSlug);
  if (!result.ok) return result;

  const to = nextSlug.trim().toLowerCase();
  await Promise.all([
    renameAppointmentSlug(currentSlug, to),
    renameSlotSlug(currentSlug, to),
    renameAvailabilitySlug(currentSlug, to),
    renameDocumentSlug(currentSlug, to),
    renameFeatureSlug(currentSlug, to),
  ]);
  return result;
}
