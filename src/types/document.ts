export const DOCUMENT_CATEGORIES = ["License", "Certification", "Identity Verification", "Other"] as const;

export interface PractitionerDocument {
  id: string;
  practitionerSlug: string;
  name: string;
  category: (typeof DOCUMENT_CATEGORIES)[number];
  uploadedAt: string;
  /** False for records created before uploads existed (demo data), which have no file behind them. */
  hasFile: boolean;
  contentType?: string;
  sizeBytes?: number;
}
