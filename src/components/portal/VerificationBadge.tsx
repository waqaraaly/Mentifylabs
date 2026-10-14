import { BadgeCheck, Clock, ShieldCheck, TriangleAlert } from "lucide-react";
import type { VerificationStatus } from "@/types/practitioner";

const BADGES = {
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    style: "bg-primary text-primary-foreground",
  },
  pending: {
    label: "Under review",
    icon: Clock,
    style: "bg-accent text-accent-strong ring-1 ring-accent-strong/30",
  },
  // Sent back with feedback: something to fix and resend, not a final no, so it is amber rather than red.
  rejected: {
    label: "Changes needed",
    icon: TriangleAlert,
    style: "bg-accent text-accent-strong ring-1 ring-accent-strong/30",
  },
  unverified: {
    label: "Not verified",
    icon: BadgeCheck,
    style: "bg-black/[0.08] text-foreground ring-1 ring-black/[0.12]",
  },
} as const;

/**
 * A bold, filled pill for a practitioner's verification state. `rejected` is a send-back with feedback,
 * which the data model stores as "unverified" plus a note (see isVerificationRejected).
 */
export function VerificationBadge({ status, rejected = false }: { status: VerificationStatus; rejected?: boolean }) {
  const badge = BADGES[rejected && status === "unverified" ? "rejected" : status];
  const Icon = badge.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold ${badge.style}`}
    >
      <Icon className="size-4" aria-hidden />
      {badge.label}
    </span>
  );
}
