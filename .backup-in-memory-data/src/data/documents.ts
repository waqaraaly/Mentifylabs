import type { PractitionerDocument } from "@/types/document";

/**
 * In-memory data source. Uploads submitted by practitioners for Super Admin
 * verification. Swap for real object storage (e.g. Cloudflare R2) later.
 */
const DOCUMENTS: PractitionerDocument[] = [
  {
    id: "doc-1",
    practitionerSlug: "dr-ali",
    name: "Clinical Psychology License.pdf",
    category: "License",
    uploadedAt: "2026-08-01T10:00:00",
  },
  {
    id: "doc-2",
    practitionerSlug: "dr-ali",
    name: "CBT Certification.pdf",
    category: "Certification",
    uploadedAt: "2026-08-01T10:05:00",
  },
  {
    id: "doc-3",
    practitionerSlug: "hina-farooq",
    name: "CNIC.jpg",
    category: "Identity Verification",
    uploadedAt: "2026-09-14T08:20:00",
  },
  {
    id: "doc-4",
    practitionerSlug: "hina-farooq",
    name: "Family Therapy Certificate.pdf",
    category: "Certification",
    uploadedAt: "2026-09-14T08:22:00",
  },
  {
    id: "doc-5",
    practitionerSlug: "omar-siddiqui",
    name: "Psychiatry Board Certification.pdf",
    category: "License",
    uploadedAt: "2026-06-10T09:00:00",
  },
];

export async function getDocumentsByPractitioner(slug: string): Promise<PractitionerDocument[]> {
  return DOCUMENTS.filter((d) => d.practitionerSlug === slug);
}

// ---- Super Admin ----

export async function getAllDocuments(): Promise<PractitionerDocument[]> {
  return [...DOCUMENTS];
}

/** Re-points a practitioner's documents at their new slug after a rename. */
export async function renameDocumentSlug(from: string, to: string): Promise<void> {
  for (const d of DOCUMENTS) if (d.practitionerSlug === from) d.practitionerSlug = to;
}
