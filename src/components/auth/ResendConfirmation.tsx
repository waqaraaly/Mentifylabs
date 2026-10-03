"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { resendConfirmationAction, type ResendState } from "@/app/verify-email/actions";

/** "Didn't get the link?": sends the confirmation email again. Shared by the check-your-email page and the sign-in form. */
export function ResendConfirmation({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<ResendState, FormData>(resendConfirmationAction, {});

  return (
    <div className="rounded-xl bg-primary/[0.07] px-4 py-3.5 text-sm leading-relaxed">
      <p className="flex items-start gap-2 text-foreground">
        <MailCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>
          We sent a confirmation link to <strong className="font-semibold break-all">{email}</strong>.
        </span>
      </p>
      <form action={formAction} className="mt-2.5 pl-6">
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={pending}
          className="font-medium text-primary underline-offset-2 hover:underline disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send it again"}
        </button>
      </form>
      {state.message && <p className="mt-2 pl-6 text-xs text-muted">{state.message}</p>}
      {state.error && (
        <p role="alert" className="mt-2 pl-6 text-xs font-medium text-alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
