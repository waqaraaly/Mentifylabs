"use client";

import { useActionState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { AuthField, AuthInput, authButtonClass } from "@/components/auth/AuthShell";
import { requestResetAction, type ForgotPasswordState } from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ForgotPasswordState, FormData>(requestResetAction, {});

  if (state.sentTo) {
    return (
      <p role="status" className="text-sm leading-relaxed">
        If <strong>{state.sentTo}</strong> belongs to a MentifyLabs account, a reset link is on its way. It works once, for
        60 minutes. Check your spam folder if it doesn&apos;t arrive in a few minutes.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <AuthField id="email" label="Email">
        <AuthInput icon={Mail} id="email" name="email" placeholder="Email address" type="email" autoComplete="email" required />
      </AuthField>
      <button type="submit" disabled={pending} className={authButtonClass}>
        {pending ? "Sending…" : "Send reset link"}
        {!pending && (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        )}
      </button>
    </form>
  );
}
