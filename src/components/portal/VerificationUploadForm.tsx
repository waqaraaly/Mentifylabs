"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { submitVerificationAction, type VerificationSubmitState } from "@/app/dashboard/verification/actions";
import { CredentialPicker, useCredentialPicker } from "./CredentialPicker";

/** How a practitioner verifies themselves: tick one or more options, add a file for each, and send them together. */
export function VerificationUploadForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<VerificationSubmitState, FormData>(submitVerificationAction, {});
  const picker = useCredentialPicker();

  return (
    <form action={formAction} className="p-6">
      <input type="hidden" name="slug" value={slug} />

      <p className="mb-4 text-sm leading-relaxed text-muted">
        Choose what you&apos;re sending and add a file for each. One is enough; add more if you have them. PDF, JPG, PNG or WebP, up to 10 MB each and 30 MB in all.
      </p>

      <CredentialPicker picker={picker} />

      <div className="mt-5 flex justify-end border-t border-black/[0.06] pt-5">
        <button
          type="submit"
          disabled={pending || !picker.ready}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit for verification"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="mt-3 text-sm font-medium text-alert">
          {state.error}
        </p>
      )}
      {state.submitted && !pending && (
        <p role="status" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary">
          <Check className="size-4" aria-hidden />
          Submitted. We&apos;ll let you know once it&apos;s reviewed.
        </p>
      )}
    </form>
  );
}
