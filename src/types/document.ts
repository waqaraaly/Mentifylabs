/**
 * The ways a practitioner can verify themselves. Each is a kind of document they upload: they tick the ones that apply
 * and add a file for each. The value is what is stored and what an admin reads, so it is written to be read.
 */
export const CREDENTIAL_TYPES = [
  { category: "License", hint: "Your professional license or registration certificate." },
  { category: "Degree", hint: "Your degree certificate or transcript." },
  { category: "Professional membership", hint: "Proof you belong to a professional body or association." },
  { category: "Experience letter", hint: "A letter from a clinic, hospital or employer." },
  { category: "Other", hint: "Anything else that shows your qualifications." },
] as const;

export type DocumentCategory = (typeof CREDENTIAL_TYPES)[number]["category"];

export const DOCUMENT_CATEGORIES: readonly DocumentCategory[] = CREDENTIAL_TYPES.map((c) => c.category);

export const isDocumentCategory = (value: unknown): value is DocumentCategory =>
  typeof value === "string" && (DOCUMENT_CATEGORIES as readonly string[]).includes(value);

export interface PractitionerDocument {
  id: string;
  practitionerSlug: string;
  name: string;
  category: DocumentCategory;
  uploadedAt: string;
  /** False for records created before uploads existed (demo data), which have no file behind them. */
  hasFile: boolean;
  contentType?: string;
  sizeBytes?: number;
}
