import Link from "next/link";
import { AlertTriangle, BadgeCheck, Clock, XCircle } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import { isVerificationRejected } from "@/lib/verification";

/**
 * Linked to /dashboard/verification, driven by verificationStatus:
 * - verified: nothing.
 * - rejected: the admin's reason, with a link to submit again (shown even if held).
 * - pending: a quiet "under review" note (documents already submitted, nothing to do).
 * - unverified, "held": Super Admin has taken the profile offline pending verification — prominent, not dismissable.
 * - a quiet, persistent reminder that publishing and accepting bookings both need verification first.
 */
export function VerificationBanner({ practitioner }: { practitioner: Practitioner }) {
  if (practitioner.verificationStatus === "verified") return null;

  if (practitioner.verificationStatus === "pending") {
    return (
      <Link
        href="/dashboard/verification"
        className="mb-6 flex items-center gap-3 rounded-xl bg-accent/[0.1] px-4 py-3 text-sm font-medium text-accent-strong ring-1 ring-accent/20 transition hover:bg-accent/[0.14]"
      >
        <Clock className="size-4 shrink-0" aria-hidden />
        Your credentials are under review. We&apos;ll let you know once they&apos;re verified.
        <span className="ml-auto shrink-0 underline">View status</span>
      </Link>
    );
  }

  if (isVerificationRejected(practitioner)) {
    return (
      <Link
        href="/dashboard/verification"
        className="mb-6 flex items-center gap-3 rounded-xl bg-alert/[0.1] px-4 py-3 text-sm font-medium text-alert ring-1 ring-alert/20 transition hover:bg-alert/[0.14]"
      >
        <XCircle className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0">Your verification wasn&apos;t approved: {practitioner.verificationNote}</span>
        <span className="ml-auto shrink-0 underline">Submit again</span>
      </Link>
    );
  }

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
  if (!practitioner.verificationPromptSeenAt) return null;

  return (
    <Link
      href="/dashboard/verification"
      className="mb-6 flex items-center gap-3 rounded-xl bg-accent/[0.1] px-4 py-3 text-sm font-medium text-accent-strong ring-1 ring-accent/20 transition hover:bg-accent/[0.14]"
    >
      <BadgeCheck className="size-4 shrink-0" aria-hidden />
      Verify your credentials to publish your profile and accept bookings.
      <span className="ml-auto shrink-0 underline">Verify now</span>
    </Link>
  );
}
