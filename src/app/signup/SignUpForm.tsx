"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { AuthError, AuthField, AuthInput, authButtonClass } from "@/components/auth/AuthShell";
import { signUpAction, type SignUpState } from "./actions";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState<SignUpState, FormData>(signUpAction, {});

  return (
    <form action={formAction} className="space-y-5">
      <AuthField id="fullName" label="Full name">
        <AuthInput
          icon={User}
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          defaultValue={state.values?.fullName}
        />
      </AuthField>

      <AuthField id="email" label="Email">
        <AuthInput
          icon={Mail}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
        />
      </AuthField>

      <AuthField id="password" label="Password" hint={<span className="text-xs text-muted">At least 8 characters</span>}>
        <AuthInput
          icon={Lock}
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </AuthField>

      <AuthError message={state.error} />

      <button type="submit" disabled={pending} className={authButtonClass}>
        {pending ? "Creating account…" : "Create account"}
        {!pending && (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        )}
      </button>
      <p className="text-xs leading-relaxed text-muted">
        Your profile stays private until the MentifyLabs team approves your account and publishes it.
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
      </p>
    </form>
  );
}
