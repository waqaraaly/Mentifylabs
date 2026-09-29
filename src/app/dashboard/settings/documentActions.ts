"use server";

import { revalidatePath } from "next/cache";
import { addDocument, deleteDocument } from "@/data/documents";
import { requireOwnSlug } from "@/data/practitioners";
import { requireRole } from "@/lib/session";
import { DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, randomKeyPart, uploads } from "@/lib/storage";
import { revalidateAdminViews } from "@/lib/revalidate";
import { DOCUMENT_CATEGORIES, type PractitionerDocument } from "@/types/document";

export interface DocumentUploadState {
  error?: string;
  uploaded?: string;
}

export async function uploadDocumentAction(_prev: DocumentUploadState, formData: FormData): Promise<DocumentUploadState> {
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

  revalidatePath("/dashboard/settings");
  revalidateAdminViews();
  return { uploaded: name };
}

export async function deleteDocumentAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const id = formData.get("id")?.toString();
  if (!id) return;
  const removed = await deleteDocument(slug, id);
  if (removed?.storageKey) await (await uploads()).delete(removed.storageKey);
  revalidatePath("/dashboard/settings");
  revalidateAdminViews();
}
