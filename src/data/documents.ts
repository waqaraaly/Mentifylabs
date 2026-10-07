import type { PractitionerDocument } from "@/types/document";
import { all, batch, first, prepare } from "@/lib/db";

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

/** How many of this practitioner's documents have a file behind them. Records with no file are not evidence. */
export async function countStoredDocuments(slug: string): Promise<number> {
  const row = await first<{ n: number }>(
    "SELECT COUNT(*) AS n FROM practitioner_documents WHERE practitioner_slug = ? AND storage_key IS NOT NULL",
    slug,
  );
  return row?.n ?? 0;
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

/** Saves several documents together: all of them, or none if any one fails. */
export async function addDocuments(
  inputs: {
    practitionerSlug: string;
    name: string;
    category: PractitionerDocument["category"];
    storageKey: string;
    contentType: string;
    sizeBytes: number;
  }[],
): Promise<void> {
  await batch(
    await Promise.all(
      inputs.map((input) =>
        prepare(
          `INSERT INTO practitioner_documents (practitioner_slug, name, category, storage_key, content_type, size_bytes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          input.practitionerSlug,
          input.name,
          input.category,
          input.storageKey,
          input.contentType,
          input.sizeBytes,
        ),
      ),
    ),
  );
}

// ---- Super Admin ----

export async function getAllDocuments(): Promise<PractitionerDocument[]> {
  const rows = await all<DocumentRow>("SELECT * FROM practitioner_documents ORDER BY uploaded_at");
  return rows.map(toDocument);
}
