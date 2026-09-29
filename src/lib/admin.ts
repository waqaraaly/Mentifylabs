import type { Appointment } from "@/types/appointment";
import type { Practitioner } from "@/types/practitioner";
import { hasFeeRange } from "@/lib/fees";

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const AVATAR_TONES = [
  "#cfd9c8", "#d8c9b8", "#c7d4d4", "#dbcccf", "#d6cfde",
  "#d3d0c4", "#cbd6c9", "#dccfc1", "#cdd5dd", "#dccac6",
];

/** Deterministic pastel tone derived from the slug, so it's stable across server/client renders. */
export function avatarTone(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

/** Fields the public profile is missing before it can be approved. */
export function computeProfileGaps(p: Practitioner): string[] {
  const gaps: string[] = [];
  if (!p.photoUrl) gaps.push("Profile photo");
  if (!p.bio || p.bio.trim().length < 120) gaps.push("Bio (120+ characters)");
  if (!hasFeeRange(p.feeRange)) gaps.push("Fee range");
  if (p.certifications.length === 0) gaps.push("Certifications");
  if (p.specializations.length === 0) gaps.push("Specializations");
  return gaps;
}

export interface BookingStats {
  total: number;
  completed: number;
  cancelled: number;
  upcoming: number;
}

export function bookingStatsFor(slug: string, appointments: Appointment[]): BookingStats {
  const own = appointments.filter((a) => a.practitionerSlug === slug);
  return {
    total: own.length,
    completed: own.filter((a) => a.status === "completed").length,
    cancelled: own.filter((a) => a.status === "cancelled").length,
    upcoming: own.filter((a) => a.status === "confirmed" || a.status === "pending").length,
  };
}

export function publicLinkFor(slug: string, siteUrl: string): string {
  return siteUrl.replace(/^https?:\/\//, "") + "/" + slug;
}
