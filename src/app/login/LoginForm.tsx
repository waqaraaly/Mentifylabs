"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { LoadingOverlay } from "@/components/ui/BrainLoader";
import { AuthError, AuthField, AuthInput, authButtonClass } from "@/components/auth/AuthShell";
import { signInAction, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signInAction, {});

  return (
    <form action={formAction} className="space-y-5">
      <LoadingOverlay active={pending} message="Signing you in…" />
      {next && <input type="hidden" name="next" value={next} />}

      <AuthField id="email" label="Email">
        <AuthInput
          icon={Mail}
          id="email"
          name="email"
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
        <AuthInput icon={Lock} id="password" name="password" type="password" autoComplete="current-password" required />
      </AuthField>

      <AuthError message={state.error} />

      <button type="submit" disabled={pending} className={authButtonClass}>
        {pending ? "Signing in…" : "Sign in"}
        {!pending && (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        )}
      </button>
    </form>
  );
}
