import type { PractitionerDocument } from "@/types/document";
import { all, first, run } from "@/lib/db";

/** Verification uploads. The metadata lives here; the file itself is in R2 under storage_key. */
interface DocumentRow {
  id: string;
  practitioner_slug: string;
  name: string;
  category: PractitionerDocument["category"];
  uploaded_at: string;
  storage_key: string | null;
  content_type: string | null;
  size_bytes: number | null;
}

const toDocument = (r: DocumentRow): PractitionerDocument => ({
  id: r.id,
  practitionerSlug: r.practitioner_slug,
  name: r.name,
  category: r.category,
  uploadedAt: r.uploaded_at,
  hasFile: r.storage_key !== null,
  contentType: r.content_type ?? undefined,
  sizeBytes: r.size_bytes ?? undefined,
});

export async function getDocumentsByPractitioner(slug: string): Promise<PractitionerDocument[]> {
  const rows = await all<DocumentRow>(
    "SELECT * FROM practitioner_documents WHERE practitioner_slug = ? ORDER BY uploaded_at DESC",
    slug,
  );
  return rows.map(toDocument);
}

/** The document and where its file is stored — for the download route, which does its own access check. */
export async function getDocumentFile(
  id: string,
): Promise<{ practitionerSlug: string; name: string; storageKey: string; contentType: string } | null> {
  const row = await first<DocumentRow>("SELECT * FROM practitioner_documents WHERE id = ?", id);
  if (!row?.storage_key) return null;
  return {
    practitionerSlug: row.practitioner_slug,
    name: row.name,
    storageKey: row.storage_key,
    contentType: row.content_type ?? "application/octet-stream",
  };
}

export async function addDocument(input: {
  practitionerSlug: string;
  name: string;
  category: PractitionerDocument["category"];
  storageKey: string;
  contentType: string;
  sizeBytes: number;
}): Promise<void> {
  await run(
    `INSERT INTO practitioner_documents (practitioner_slug, name, category, storage_key, content_type, size_bytes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.practitionerSlug,
    input.name,
    input.category,
    input.storageKey,
    input.contentType,
    input.sizeBytes,
  );
}

/**
 * Deletes one of this practitioner's documents. Returns null if it isn't theirs, otherwise the R2 key
 * of its file (null for demo records without one) so the caller can remove the file too.
 */
export async function deleteDocument(slug: string, id: string): Promise<{ storageKey: string | null } | null> {
  const row = await first<{ storage_key: string | null }>(
    "DELETE FROM practitioner_documents WHERE id = ? AND practitioner_slug = ? RETURNING storage_key",
    id,
    slug,
  );
  return row ? { storageKey: row.storage_key } : null;
}

// ---- Super Admin ----

export async function getAllDocuments(): Promise<PractitionerDocument[]> {
  const rows = await all<DocumentRow>("SELECT * FROM practitioner_documents ORDER BY uploaded_at");
  return rows.map(toDocument);
}
