"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { LoadingOverlay, SIGNED_IN_LOADER_MS } from "@/components/ui/BrainLoader";
import { AuthError, AuthField, AuthInput, authButtonClass } from "@/components/auth/AuthShell";
import { ResendConfirmation } from "@/components/auth/ResendConfirmation";
import { signInAction, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signInAction, {});
  const router = useRouter();

  useEffect(() => {
    const to = state.redirectTo;
    if (!to) return;
    router.prefetch(to);
    // Signed in: let the brain play for a moment before the portal opens. Going on to the code page waits for nothing.
    const timer = setTimeout(() => router.replace(to), state.needsCode ? 0 : SIGNED_IN_LOADER_MS);
    return () => clearTimeout(timer);
  }, [state.redirectTo, state.needsCode, router]);

  // The animation only plays once they are really signed in. While the password is being checked, or the emailed code
  // is still to come, the button alone shows that something is happening.
  const signedIn = !!state.redirectTo && !state.needsCode;

  return (
    <form action={formAction} className="space-y-5">
      <LoadingOverlay active={signedIn} delay={0} message="Signing you in…" />
      {next && <input type="hidden" name="next" value={next} />}

      <AuthField id="email" label="Email">
        <AuthInput
          icon={Mail}
          id="email"
          name="email"
          placeholder="Email address"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
        />
      </AuthField>

      <AuthField
        id="password"
        label="Password"
        hint={
          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        }
      >
        <AuthInput icon={Lock} id="password" name="password" placeholder="Password" type="password" autoComplete="current-password" required />
      </AuthField>

      <AuthError message={state.error} />
      {state.unverified && state.email && <ResendConfirmation email={state.email} />}

      <button type="submit" disabled={pending || !!state.redirectTo} className={authButtonClass}>
        {pending || state.redirectTo ? "Signing in…" : "Sign in"}
        {!pending && !state.redirectTo && (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        )}
      </button>
    </form>
  );
}
