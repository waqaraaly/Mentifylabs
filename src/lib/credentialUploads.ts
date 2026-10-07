import "server-only";
import { addDocuments, getDocumentsByPractitioner } from "@/data/documents";
import { MAX_CREDENTIAL_BATCH_BYTES, MAX_DOCUMENT_BYTES } from "@/lib/documentLimits";
import { DOCUMENT_TYPES, MAX_DOCUMENTS_PER_PRACTITIONER, matchesFileSignature, randomKeyPart, uploads } from "@/lib/storage";
import { isDocumentCategory, type DocumentCategory } from "@/types/document";

/** The form field that lists the options ticked, once per option. */
export const CREDENTIAL_FIELD = "credentialCategory";

/** The form field that carries the file for one option. */
export const credentialFileField = (category: string) => `credentialFile:${category}`;

export type SaveCredentialsResult = { ok: true; saved: number; categories: DocumentCategory[] } | { ok: false; error: string };

interface Checked {
  category: DocumentCategory;
  file: File;
  extension: string;
  bytes: ArrayBuffer;
}

/**
 * Saves a verification submission: one file for each option the practitioner ticked.
 *
 * Every option ticked must come with a valid file, and all of them are checked before anything is stored, so a problem
 * with the third file never leaves the first two behind. The files are then stored and their records written as one
 * step; if that fails, the stored files are removed again.
 */
export async function saveCredentialUploads(slug: string, practitionerId: string, formData: FormData): Promise<SaveCredentialsResult> {
  const chosen = [...new Set(formData.getAll(CREDENTIAL_FIELD).map((value) => value.toString()))];
  if (chosen.length === 0) return { ok: false, error: "Choose at least one way to verify yourself." };

  const checked: Checked[] = [];
  let totalBytes = 0;
  for (const category of chosen) {
    if (!isDocumentCategory(category)) return { ok: false, error: "Choose from the list of options." };

    const file = formData.get(credentialFileField(category));
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: `Add a file for ${category}.` };
    const extension = DOCUMENT_TYPES[file.type];
    if (!extension) return { ok: false, error: `${category}: upload a PDF, JPG, PNG or WebP file.` };
    if (file.size > MAX_DOCUMENT_BYTES) return { ok: false, error: `${category}: that file is too large. The limit is 10 MB.` };

    const bytes = await file.arrayBuffer();
    if (!matchesFileSignature(bytes, file.type)) return { ok: false, error: `${category}: that doesn't look like a valid PDF or image.` };

    totalBytes += file.size;
    checked.push({ category, file, extension, bytes });
  }

  if (totalBytes > MAX_CREDENTIAL_BATCH_BYTES) {
    return { ok: false, error: "Your files add up to more than 30 MB. Use smaller files." };
  }
  const onFile = (await getDocumentsByPractitioner(slug)).length;
  if (onFile + checked.length > MAX_DOCUMENTS_PER_PRACTITIONER) {
    return { ok: false, error: `You can keep up to ${MAX_DOCUMENTS_PER_PRACTITIONER} documents on file. Delete some first.` };
  }

  // Everything checks out: store the files, then write all the records in one step.
  const bucket = await uploads();
  const keys: string[] = [];
  try {
    const records = [];
    for (const { category, file, extension, bytes } of checked) {
      const key = `documents/${practitionerId}/${randomKeyPart()}.${extension}`;
      await bucket.put(key, bytes, { httpMetadata: { contentType: file.type } });
      keys.push(key);
      const name = file.name.replace(/[\u0000-\u001f]/g, "").slice(0, 150) || `${category}.${extension}`;
      records.push({ practitionerSlug: slug, name, category, storageKey: key, contentType: file.type, sizeBytes: file.size });
    }
    await addDocuments(records);
  } catch (error) {
    // Don't leave files behind that no record points to.
    await Promise.all(keys.map((key) => bucket.delete(key).catch(() => undefined)));
    throw error;
  }
  return { ok: true, saved: checked.length, categories: checked.map((c) => c.category) };
}
