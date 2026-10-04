import type { ReactNode } from "react";
import { STATUS_META } from "./statusMeta";
import { verificationState } from "@/lib/verification";
import { headlineOf, isLive, type HeadlineTone } from "@/lib/practitionerState";
import type { Practitioner } from "@/types/practitioner";

export function Badge({
  kind,
  children,
  dot = true,
}: {
  kind: string;
  children?: ReactNode;
  dot?: boolean;
}) {
  const meta = STATUS_META[kind] ?? { label: kind, color: "var(--ml-neutral)", bg: "var(--ml-neutral-bg)" };
  return (
    <span className="badge" style={{ color: meta.color, background: meta.bg }}>
      {dot && <span className="badge-dot" />}
      {children ?? meta.label}
    </span>
  );
}

const TONE_KIND: Record<HeadlineTone, string> = { ok: "active", warn: "pending", danger: "suspended", neutral: "draft" };

/** The one-word state of a practitioner, read from their account, profile and verification together. */
export function HeadlineBadge({ p }: { p: Pick<Practitioner, "status" | "profileStatus" | "verificationStatus" | "verificationNote" | "emailUnconfirmed" | "creationMethod" | "hasLogin"> }) {
  const h = headlineOf(p);
  return (
    <span title={h.hint}>
      <Badge kind={TONE_KIND[h.tone]}>{h.label}</Badge>
    </span>
  );
}

/** The profile's two states: Live, or Not live (hover for why). */
export function ProfileBadge({ p }: { p: Pick<Practitioner, "status" | "profileStatus" | "verificationStatus" | "verificationNote" | "emailUnconfirmed" | "creationMethod" | "hasLogin"> }) {
  const live = isLive(p);
  const h = headlineOf(p);
  return (
    <span title={live ? h.hint : `Not live: ${h.label}. ${h.hint}`}>
      {live ? <Badge kind="active">Live</Badge> : <Badge kind="draft">Not live</Badge>}
    </span>
  );
}

/** Unverified, Pending, Verified or Rejected: the four things a practitioner's credentials can be. */
export function VerificationBadge({ p }: { p: Pick<Practitioner, "verificationStatus" | "verificationNote"> }) {
  return <Badge kind={verificationState(p)} />;
}
