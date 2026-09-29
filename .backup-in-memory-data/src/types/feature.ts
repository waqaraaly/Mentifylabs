export type FeatureStatus = "live" | "beta" | "disabled";

export interface Feature {
  id: string;
  name: string;
  description: string;
  /** lucide-react icon name, e.g. "Video" */
  icon: string;
  category: string;
  status: FeatureStatus;
  /** Default access for practitioners with no individual override. */
  sharedByDefault: boolean;
  quantity?: number;
  unit?: string;
  plan: string;
}

/** A grant or revoke of one feature to one practitioner, overriding the default. */
export interface FeatureAccess {
  featureId: string;
  practitionerSlug: string;
}

export type FeatureLogAction = "granted" | "revoked" | "enabled_all" | "disabled_all";

export interface FeatureAccessLog {
  id: string;
  featureId: string;
  /** Practitioner slug, or null when the action applied to all practitioners. */
  practitionerSlug: string | null;
  action: FeatureLogAction;
  by: string;
  at: string;
  note?: string;
}
