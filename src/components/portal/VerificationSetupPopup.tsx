"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { dismissVerificationPromptAction } from "@/app/dashboard/verification/actions";
import { VERIFICATION_WINDOW_DAYS } from "@/lib/verification";

/** The one-time "set up verification" popup shown on a practitioner's first login. */
export function VerificationSetupPopup({ show }: { show: boolean }) {
  const [open, setOpen] = useState(show);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!open) return null;

  const dismiss = () => startTransition(async () => {
    await dismissVerificationPromptAction();
    setOpen(false);
  });

  const verifyNow = () => startTransition(async () => {
    await dismissVerificationPromptAction();
    setOpen(false);
    router.push("/dashboard/verification");
  });

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={dismiss} />
      <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-7 shadow-2xl ring-1 ring-border">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/[0.1] text-primary">
          <BadgeCheck className="size-5" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">Verify your account</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Welcome to MentifyLabs. Upload your degree, license or another credential so clients can see you&apos;re a
          verified practitioner. You have {VERIFICATION_WINDOW_DAYS} days to complete this — after that, your profile
          may be temporarily taken offline until you do.
        </p>
        <p className="mt-2 text-sm text-muted">You can skip this for now and come back to it any time.</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={dismiss}
            disabled={pending}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted ring-1 ring-border transition hover:bg-foreground/[0.05] disabled:opacity-60"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={verifyNow}
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            Verify now
          </button>
        </div>
      </div>
    </>
  );
}
