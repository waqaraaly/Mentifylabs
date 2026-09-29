export interface PractitionerDocument {
  id: string;
  practitionerSlug: string;
  name: string;
  category: "License" | "Certification" | "Identity Verification" | "Other";
  uploadedAt: string;
}
