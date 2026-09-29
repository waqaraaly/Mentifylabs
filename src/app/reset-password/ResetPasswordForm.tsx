"use client";

import { useActionState } from "react";
import { ArrowRight, KeyRound, Lock } from "lucide-react";
import { AuthError, AuthField, AuthInput, authButtonClass } from "@/components/auth/AuthShell";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(resetPasswordAction, {});

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <AuthField id="password" label="New password" hint={<span className="text-xs text-muted">At least 8 characters</span>}>
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
      <AuthField id="confirm" label="Confirm new password">
        <AuthInput
          icon={KeyRound}
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </AuthField>
      <AuthError message={state.error} />
      <button type="submit" disabled={pending} className={authButtonClass}>
        {pending ? "Saving…" : "Save password and sign in"}
        {!pending && (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        )}
      </button>
    </form>
  );
}
