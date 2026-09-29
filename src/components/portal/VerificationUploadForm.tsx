"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { submitVerificationAction, type VerificationSubmitState } from "@/app/dashboard/verification/actions";
import { settingsInputClass } from "@/components/portal/SettingsRow";
import { DOCUMENT_CATEGORIES } from "@/types/document";

export function VerificationUploadForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<VerificationSubmitState, FormData>(submitVerificationAction, {});

  return (
    <form action={formAction} className="px-6 py-6">
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <label className="sr-only" htmlFor="verificationCategory">
          Document type
        </label>
        <select id="verificationCategory" name="category" required defaultValue="" className={settingsInputClass}>
          <option value="" disabled>
            Document type
          </option>
          {DOCUMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="verificationFile">
          File
        </label>
        <input
          id="verificationFile"
          name="file"
          type="file"
          required
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/[0.1] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">PDF, JPG, PNG or WebP, up to 10 MB.</p>
        <button
          type="submit"
          disabled={pending}
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
          Submitted — the MentifyLabs team will review it shortly.
        </p>
      )}
    </form>
  );
}
