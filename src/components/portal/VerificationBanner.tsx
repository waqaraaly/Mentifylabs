import Link from "next/link";
import { AlertTriangle, BadgeCheck } from "lucide-react";
import { verificationDaysLeft } from "@/lib/verification";
import type { Practitioner } from "@/types/practitioner";

/**
 * Two states, both linking to /dashboard/verification:
 * - "held": Super Admin has taken the profile offline pending verification — prominent, not dismissable.
 * - a quiet reminder of the 60-day window, shown after the first-login popup is dismissed.
 */
export function VerificationBanner({ practitioner }: { practitioner: Practitioner }) {
  if (practitioner.verificationStatus === "verified") return null;

  const held = practitioner.profileStatus === "hidden";
  if (held) {
    return (
      <Link
        href="/dashboard/verification"
        className="mb-6 flex items-center gap-3 rounded-xl bg-alert/[0.1] px-4 py-3 text-sm font-medium text-alert ring-1 ring-alert/20 transition hover:bg-alert/[0.14]"
      >
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        Your profile access has been held — please verify your account to restore it.
        <span className="ml-auto shrink-0 underline">Verify now</span>
      </Link>
    );
  }

  // Only a quiet reminder once they've seen the first-login popup; it covers the initial nudge.
  if (!practitioner.verificationPromptSeenAt || practitioner.verificationStatus !== "unverified") return null;

  const daysLeft = verificationDaysLeft(practitioner.dateJoined);
  if (daysLeft > 14) return null;

  return (
    <Link
      href="/dashboard/verification"
      className="mb-6 flex items-center gap-3 rounded-xl bg-accent/[0.1] px-4 py-3 text-sm font-medium text-accent-strong ring-1 ring-accent/20 transition hover:bg-accent/[0.14]"
    >
      <BadgeCheck className="size-4 shrink-0" aria-hidden />
      {daysLeft >= 0 ? `${daysLeft} days left to verify your account.` : "Your verification window has passed."}
      <span className="ml-auto shrink-0 underline">Verify now</span>
    </Link>
  );
}
