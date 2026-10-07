"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPractitioner, requireOwnSlug, submitVerification } from "@/data/practitioners";
import { recordReviewEvent } from "@/data/reviewEvents";
import { saveCredentialUploads } from "@/lib/credentialUploads";
import { requireRole } from "@/lib/session";
import { revalidateAdminViews } from "@/lib/revalidate";

export interface VerificationSubmitState {
  error?: string;
  submitted?: boolean;
}

/**
 * Submits a verification: one file for each option the practitioner ticked, saved together and sent for review as one
 * submission. Nothing is saved unless every ticked option has a valid file.
 */
export async function submitVerificationAction(
  _prev: VerificationSubmitState,
  formData: FormData,
): Promise<VerificationSubmitState> {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const { practitionerId } = await requireRole("practitioner");
  if (!practitionerId) return { error: "This account has no practitioner profile." };

  const result = await saveCredentialUploads(slug, practitionerId, formData);
  if (!result.ok) return { error: result.error };

  // Someone already verified keeps their verified status when they add more documents.
  if ((await getCurrentPractitioner()).verificationStatus !== "verified") {
    if (await submitVerification(slug)) {
      await recordReviewEvent(slug, "verification_submitted", { note: `Submitted: ${result.categories.join(", ")}` });
    }
  }

  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard");
  revalidateAdminViews();
  return { submitted: true };
}
