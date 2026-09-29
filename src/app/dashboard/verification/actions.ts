"use server";

import { revalidatePath } from "next/cache";
import { addDocument } from "@/data/documents";
import { dismissVerificationPrompt, getCurrentPractitioner, requireOwnSlug, submitVerification } from "@/data/practitioners";
import { requireRole } from "@/lib/session";
import { revalidateAdminViews } from "@/lib/revalidate";
import { DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, randomKeyPart, uploads } from "@/lib/storage";
import { DOCUMENT_CATEGORIES, type PractitionerDocument } from "@/types/document";

export interface VerificationSubmitState {
  error?: string;
  submitted?: boolean;
}

export async function submitVerificationAction(
  _prev: VerificationSubmitState,
  formData: FormData,
): Promise<VerificationSubmitState> {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const category = formData.get("category")?.toString() as PractitionerDocument["category"];
  if (!DOCUMENT_CATEGORIES.includes(category)) return { error: "Choose what kind of document this is." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  const extension = DOCUMENT_TYPES[file.type];
  if (!extension) return { error: "Upload a PDF, JPG, PNG or WebP file." };
  if (file.size > MAX_DOCUMENT_BYTES) return { error: "That file is too large. The limit is 10 MB." };

  const { practitionerId } = await requireRole("practitioner");
  const key = `documents/${practitionerId}/${randomKeyPart()}.${extension}`;
  await (await uploads()).put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  const name = file.name.replace(/[\u0000-\u001f]/g, "").slice(0, 150) || `document.${extension}`;
  await addDocument({ practitionerSlug: slug, name, category, storageKey: key, contentType: file.type, sizeBytes: file.size });
  await submitVerification(slug);

  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard");
  revalidateAdminViews();
  return { submitted: true };
}

/** Marks the first-login setup popup as seen, so it doesn't show again. */
export async function dismissVerificationPromptAction() {
  const practitioner = await getCurrentPractitioner();
  await dismissVerificationPrompt(practitioner.slug);
  revalidatePath("/dashboard");
}
