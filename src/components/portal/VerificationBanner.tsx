"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BadgeCheck, Clock, UserRound, X } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import { isVerificationRejected } from "@/lib/verification";

const STORAGE_PREFIX = "banner-dismissed:";

// Dismissals live in sessionStorage (so they last for the browser session), with an in-memory copy for
// when storage is blocked. The store lets every render read them without setting state in an effect.
const closed = new Set<string>();
const listeners = new Set<() => void>();

function isClosed(key: string | null): boolean {
  if (!key) return false;
  if (closed.has(key)) return true;
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

function close(key: string) {
  closed.add(key);
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, "1");
  } catch {
    // Not remembered across pages, but it is closed for now.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

interface BannerSpec {
  /** Changes whenever the message does, so a new situation (e.g. a fresh rejection) shows again after a dismissal. */
  key: string;
  tone: "accent" | "alert";
  icon: ReactNode;
  text: ReactNode;
  action: string;
  href: string;
  /** A setup reminder rather than a status change: shown on the dashboard only, so it doesn't nag on every page. */
  dashboardOnly?: boolean;
}

/**
 * Which notice, if any, this practitioner should see above the page:
 * - verified: nothing.
 * - pending: a quiet "under review" note.
 * - rejected: the admin's reason, with a link to submit again.
 * - held: Super Admin took the profile offline pending verification.
 * - otherwise a reminder that publishing and accepting bookings need verification first.
 */
function bannerFor(practitioner: Practitioner): BannerSpec | null {
  const profileSaved = !!practitioner.profileSavedAt;

  if (practitioner.verificationStatus === "verified") {
    if (profileSaved) return null;
    return {
      key: "complete-profile",
      tone: "accent",
      icon: <UserRound className="size-4 shrink-0" aria-hidden />,
      text: "Complete your profile so clients can find and book you.",
      action: "Complete profile",
      href: "/dashboard/profile",
      dashboardOnly: true,
    };
  }

  if (practitioner.verificationStatus === "pending") {
    return {
      key: "pending",
      tone: "accent",
      icon: <Clock className="size-4 shrink-0" aria-hidden />,
      text: "Your credentials are under review. We'll let you know once they're verified.",
      action: "View status",
      href: "/dashboard/verification",
    };
  }

  if (isVerificationRejected(practitioner)) {
    return {
      key: `rejected:${practitioner.verificationNote}`,
      tone: "accent",
      icon: <AlertTriangle className="size-4 shrink-0" aria-hidden />,
      // The admin's reason is on the Verification page, not repeated on every page.
      text: "Your verification needs changes.",
      action: "Submit again",
      href: "/dashboard/verification",
    };
  }

  if (practitioner.profileStatus === "hidden") {
    return {
      key: "held",
      tone: "alert",
      icon: <AlertTriangle className="size-4 shrink-0" aria-hidden />,
      text: "Your profile access has been held. Please verify your account to restore it.",
      action: "Verify now",
      href: "/dashboard/verification",
    };
  }

  // Only a quiet reminder once they've seen the first-login popup; it covers the initial nudge.
  if (!practitioner.verificationPromptSeenAt) return null;

  return {
    key: profileSaved ? "unverified" : "unverified:complete-profile",
    tone: "accent",
    icon: <BadgeCheck className="size-4 shrink-0" aria-hidden />,
    text: profileSaved
      ? "Verify your credentials to publish your profile and accept bookings."
      : "Complete your profile and verify your credentials to publish and accept bookings.",
    action: profileSaved ? "Verify now" : "Get started",
    // Until the profile is saved, the profile comes first; the credentials step follows from its own page.
    href: profileSaved ? "/dashboard/verification" : "/dashboard/profile",
    dashboardOnly: true,
  };
}

const TONES = {
  accent: "bg-accent/[0.1] text-accent-strong ring-accent/20 hover:bg-accent/[0.14]",
  alert: "bg-alert/[0.1] text-alert ring-alert/20 hover:bg-alert/[0.14]",
} as const;

/**
 * Shown above every portal page. Can be closed with the X; that is remembered for the rest of the browser
 * session, and the notice comes back next time (or straight away if its message changes).
 */
export function VerificationBanner({ practitioner }: { practitioner: Practitioner }) {
  const pathname = usePathname();
  const spec = bannerFor(practitioner);
  const key = spec?.key ?? null;

  // Hidden on the server and during hydration, so a dismissed banner never flashes back in on each page.
  const dismissed = useSyncExternalStore(
    subscribe,
    () => isClosed(key),
    () => true,
  );

  // The Verification page already shows the full status, so the banner would only repeat it there.
  if (!spec || dismissed || pathname.startsWith(spec.href)) return null;
  if (spec.dashboardOnly && pathname !== "/dashboard") return null;

  return (
    <div className={`mb-6 flex items-center gap-1 rounded-xl text-sm font-medium ring-1 transition ${TONES[spec.tone]}`}>
      <Link href={spec.href} className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-2 pl-4">
        {spec.icon}
        {spec.text}
        <span className="ml-auto shrink-0 underline">{spec.action}</span>
      </Link>
      <button
        type="button"
        onClick={() => close(spec.key)}
        aria-label="Dismiss this notice"
        title="Dismiss"
        className="mr-2 flex size-8 shrink-0 items-center justify-center rounded-lg opacity-70 transition hover:bg-black/[0.06] hover:opacity-100"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
