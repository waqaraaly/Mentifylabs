"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { AuthError, AuthField, AuthInput, authButtonClass } from "@/components/auth/AuthShell";
import { useDeviceTimeZone } from "@/lib/useDeviceTimeZone";
import { signUpAction, type SignUpState } from "./actions";

export function SignUpForm({ startingName = "" }: { startingName?: string }) {
  const [state, formAction, pending] = useActionState<SignUpState, FormData>(signUpAction, {});
  // Pre-fills the practitioner's time zone from this device. They can change it in Settings; the server checks it is a real zone.
  const timezone = useDeviceTimeZone() ?? "";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="timezone" value={timezone} />
      <AuthField id="fullName" label="Full name">
        <AuthInput
          icon={User}
          id="fullName"
          name="fullName"
          placeholder="Full name"
          autoComplete="name"
          required
          defaultValue={state.values?.fullName ?? startingName}
        />
      </AuthField>

      <AuthField id="email" label="Email">
        <AuthInput
          icon={Mail}
          id="email"
          name="email"
          placeholder="Email address"
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
          placeholder="Password"
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
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
      </p>
    </form>
  );
}
