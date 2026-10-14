"use client";

import Link from "next/link";
import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound } from "lucide-react";
import { LoadingOverlay, SIGNED_IN_LOADER_MS } from "@/components/ui/BrainLoader";
import { AuthError, AuthField, AuthInput, authButtonClass } from "@/components/auth/AuthShell";
import { resendCodeAction, verifyCodeAction, type VerifyState } from "./actions";

export function VerifyCodeForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<VerifyState, FormData>(verifyCodeAction, {});
  const router = useRouter();
  const [resent, startResend] = useTransition();
  const [resendState, setResendState] = useActionState<VerifyState, void>(async () => resendCodeAction(), {});

  useEffect(() => {
    const to = state.redirectTo;
    if (!to) return;
    router.prefetch(to);
    // The code was right: let the brain play for a moment before the portal opens.
    const timer = setTimeout(() => router.replace(to), SIGNED_IN_LOADER_MS);
    return () => clearTimeout(timer);
  }, [state.redirectTo, router]);

  // Only a correct code ends in a sign-in, so only then does the animation play. A wrong code just shows its error.
  const signedIn = !!state.redirectTo;

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-5">
        <LoadingOverlay active={signedIn} delay={0} message="Signing you in…" />
        {next && <input type="hidden" name="next" value={next} />}

        <AuthField id="code" label="Sign-in code">
          <AuthInput
            icon={KeyRound}
            id="code"
            name="code"
            placeholder="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={9}
            required
            autoFocus
          />
        </AuthField>

        <AuthError message={state.error ?? resendState.error} />
        {resendState.message && !state.error && (
          <p role="status" className="rounded-lg bg-primary/[0.08] px-3.5 py-2.5 text-sm font-medium text-primary">
            {resendState.message}
          </p>
        )}
        {(state.restart || resendState.restart) && (
          <p className="text-sm text-muted">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in again
            </Link>{" "}
            to get a new code.
          </p>
        )}

        <button type="submit" disabled={pending || signedIn} className={authButtonClass}>
          {pending || signedIn ? "Checking…" : "Verify and sign in"}
          {!pending && !signedIn && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Didn&apos;t get it?{" "}
        <button
          type="button"
          disabled={resent}
          onClick={() => startResend(() => setResendState())}
          className="font-medium text-primary hover:underline disabled:opacity-60"
        >
          Send a new code
        </button>
      </p>
    </div>
  );
}
