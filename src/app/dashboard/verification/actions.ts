"use server";

import { revalidatePath } from "next/cache";
import { addDocument, getDocumentsByPractitioner } from "@/data/documents";
import { getCurrentPractitioner, requireOwnSlug, submitVerification } from "@/data/practitioners";
import { recordReviewEvent } from "@/data/reviewEvents";
import { requireRole } from "@/lib/session";
import { revalidateAdminViews } from "@/lib/revalidate";
import {
  DOCUMENT_TYPES,
  MAX_DOCUMENTS_PER_PRACTITIONER,
  MAX_DOCUMENT_BYTES,
  matchesFileSignature,
  randomKeyPart,
  uploads,
} from "@/lib/storage";
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

  const bytes = await file.arrayBuffer();
  if (!matchesFileSignature(bytes, file.type)) return { error: "That file doesn't look like a valid PDF or image." };
  if ((await getDocumentsByPractitioner(slug)).length >= MAX_DOCUMENTS_PER_PRACTITIONER) {
    return { error: `You can keep up to ${MAX_DOCUMENTS_PER_PRACTITIONER} documents on file. Delete one first.` };
  }

  const { practitionerId } = await requireRole("practitioner");
  const key = `documents/${practitionerId}/${randomKeyPart()}.${extension}`;
  const bucket = await uploads();
  await bucket.put(key, bytes, { httpMetadata: { contentType: file.type } });

  const name = file.name.replace(/[\u0000-\u001f]/g, "").slice(0, 150) || `document.${extension}`;
  try {
    await addDocument({ practitionerSlug: slug, name, category, storageKey: key, contentType: file.type, sizeBytes: file.size });
  } catch (error) {
    await bucket.delete(key); // don't leave an orphaned file in storage
    throw error;
  }
  // Someone already verified keeps their verified status when they add another document.
  if ((await getCurrentPractitioner()).verificationStatus !== "verified") {
    await submitVerification(slug);
    await recordReviewEvent(slug, "verification_submitted");
  }

  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard");
  revalidateAdminViews();
  return { submitted: true };
}
