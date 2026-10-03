"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { AuthError, authButtonClass } from "@/components/auth/AuthShell";
import { confirmEmailAction, type ConfirmState } from "./actions";

export function ConfirmEmailForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ConfirmState, FormData>(confirmEmailAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <AuthError message={state.error} />
      <button type="submit" disabled={pending} className={authButtonClass}>
        {pending ? "Confirming…" : "Confirm my email"}
        {!pending && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />}
      </button>
    </form>
  );
}
