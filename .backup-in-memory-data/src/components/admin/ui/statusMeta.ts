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
  active: { label: "Active", color: "var(--zf-ok)", bg: "var(--zf-ok-bg)" },
  pending: { label: "Pending", color: "var(--zf-warn)", bg: "var(--zf-warn-bg)" },
  suspended: { label: "Suspended", color: "var(--zf-danger)", bg: "var(--zf-danger-bg)" },
  rejected: { label: "Rejected", color: "var(--zf-danger)", bg: "var(--zf-danger-bg)" },

  draft: { label: "Draft", color: "var(--zf-neutral)", bg: "var(--zf-neutral-bg)" },
  in_review: { label: "In review", color: "var(--zf-info)", bg: "var(--zf-info-bg)" },
  published: { label: "Published", color: "var(--zf-ok)", bg: "var(--zf-ok-bg)" },
  hidden: { label: "Hidden", color: "var(--zf-neutral)", bg: "var(--zf-neutral-bg)" },
  incomplete: { label: "Incomplete", color: "var(--zf-warn)", bg: "var(--zf-warn-bg)" },

  confirmed: { label: "Confirmed", color: "var(--zf-ok)", bg: "var(--zf-ok-bg)" },
  completed: { label: "Completed", color: "var(--zf-info)", bg: "var(--zf-info-bg)" },
  cancelled: { label: "Cancelled", color: "var(--zf-danger)", bg: "var(--zf-danger-bg)" },

  live: { label: "Live", color: "var(--zf-ok)", bg: "var(--zf-ok-bg)" },
  beta: { label: "Beta", color: "var(--zf-info)", bg: "var(--zf-info-bg)" },
  disabled: { label: "Disabled", color: "var(--zf-neutral)", bg: "var(--zf-neutral-bg)" },

  info: { label: "Info", color: "var(--zf-info)", bg: "var(--zf-info-bg)" },
};
