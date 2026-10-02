"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  completeOnboarding,
  dismissVerificationPrompt,
  requireOwnSlug,
  submitVerification,
  updatePractitionerProfile,
} from "@/data/practitioners";
import { addDocument } from "@/data/documents";
import { revalidateAdminViews } from "@/lib/revalidate";
import { requireRole } from "@/lib/session";
import { DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, randomKeyPart, uploads } from "@/lib/storage";
import { DOCUMENT_CATEGORIES, type PractitionerDocument } from "@/types/document";
import type { SessionType } from "@/types/practitioner";

function stringList(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((value) => value.toString().trim())
    .filter(Boolean);
}

/**
 * The wizard's credential step is optional, so a missing or invalid file is never an
 * error here — it just means they'll do it later from Verification, same as skipping.
 */
async function submitOnboardingCredential(slug: string, formData: FormData): Promise<void> {
  const category = formData.get("verificationCategory")?.toString() as PractitionerDocument["category"];
  const file = formData.get("verificationFile");
  if (!DOCUMENT_CATEGORIES.includes(category) || !(file instanceof File) || file.size === 0) return;
  const extension = DOCUMENT_TYPES[file.type];
  if (!extension || file.size > MAX_DOCUMENT_BYTES) return;

  const { practitionerId } = await requireRole("practitioner");
  const key = `documents/${practitionerId}/${randomKeyPart()}.${extension}`;
  await (await uploads()).put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  const name = file.name.replace(/[\u0000-\u001f]/g, "").slice(0, 150) || `document.${extension}`;
  await addDocument({ practitionerSlug: slug, name, category, storageKey: key, contentType: file.type, sizeBytes: file.size });
  await submitVerification(slug);
}

/** Saves the wizard's fields, submits a credential if one was attached, and ends onboarding. */
export async function finishOnboardingAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());

  const feeMin = Math.max(0, Number(formData.get("feeMin")) || 0);
  const feeMax = Math.max(0, Number(formData.get("feeMax")) || 0);
  const professionalTitle = formData.get("professionalTitle")?.toString().trim();

  await updatePractitionerProfile(slug, {
    // Required on the practitioner record, so an empty submission leaves it as-is
    // rather than clearing it back to the signup placeholder.
    ...(professionalTitle ? { professionalTitle } : {}),
    shortBio: formData.get("shortBio")?.toString().trim() || undefined,
    specializations: stringList(formData, "specializations"),
    sessionType: (formData.get("sessionType")?.toString() as SessionType) || "both",
    feeRange: {
      currency: "PKR",
      min: Math.min(feeMin, feeMax),
      max: Math.max(feeMin, feeMax),
    },
  });
  await submitOnboardingCredential(slug, formData);
  // The wizard's own credential step covers the first-login nudge, so the ongoing
  // "days left to verify" banner (gated on this flag) can take over from here.
  await dismissVerificationPrompt(slug);
  await completeOnboarding(slug);

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${slug}`);
  revalidateAdminViews();
  redirect("/dashboard");
}

/** Ends onboarding without saving any of the wizard's fields. */
export async function skipOnboardingAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  await dismissVerificationPrompt(slug);
  await completeOnboarding(slug);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}
