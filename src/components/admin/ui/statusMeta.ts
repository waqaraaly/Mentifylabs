export interface StatusMeta {
  label: string;
  color: string;
  bg: string;
}

/**
 * Flat registry covering account status, profile status, booking status,
 * and feature status. Keys don't collide across those namespaces, and where
 * the same word is used (e.g. "suspended", "pending") the color intent matches.
 */
export const STATUS_META: Record<string, StatusMeta> = {
  active: { label: "Active", color: "var(--ml-ok)", bg: "var(--ml-ok-bg)" },
  pending: { label: "Pending", color: "var(--ml-warn)", bg: "var(--ml-warn-bg)" },
  suspended: { label: "Suspended", color: "var(--ml-danger)", bg: "var(--ml-danger-bg)" },
  rejected: { label: "Rejected", color: "var(--ml-danger)", bg: "var(--ml-danger-bg)" },

  draft: { label: "Draft", color: "var(--ml-neutral)", bg: "var(--ml-neutral-bg)" },
  in_review: { label: "In review", color: "var(--ml-info)", bg: "var(--ml-info-bg)" },
  published: { label: "Published", color: "var(--ml-ok)", bg: "var(--ml-ok-bg)" },
  hidden: { label: "Hidden", color: "var(--ml-neutral)", bg: "var(--ml-neutral-bg)" },
  incomplete: { label: "Incomplete", color: "var(--ml-warn)", bg: "var(--ml-warn-bg)" },

  unverified: { label: "Unverified", color: "var(--ml-neutral)", bg: "var(--ml-neutral-bg)" },
  verified: { label: "Verified", color: "var(--ml-ok)", bg: "var(--ml-ok-bg)" },

  confirmed: { label: "Confirmed", color: "var(--ml-ok)", bg: "var(--ml-ok-bg)" },
  completed: { label: "Completed", color: "var(--ml-info)", bg: "var(--ml-info-bg)" },
  cancelled: { label: "Cancelled", color: "var(--ml-danger)", bg: "var(--ml-danger-bg)" },

  live: { label: "Live", color: "var(--ml-ok)", bg: "var(--ml-ok-bg)" },
  beta: { label: "Beta", color: "var(--ml-info)", bg: "var(--ml-info-bg)" },
  disabled: { label: "Disabled", color: "var(--ml-neutral)", bg: "var(--ml-neutral-bg)" },

  // Session mode: the same amber / green pairing the practitioner portal uses for Online and On-Site.
  online: { label: "Online", color: "var(--ml-warn)", bg: "var(--ml-warn-bg)" },
  onsite: { label: "On-Site", color: "var(--ml-ok)", bg: "var(--ml-ok-bg)" },

  info: { label: "Info", color: "var(--ml-info)", bg: "var(--ml-info-bg)" },
};
