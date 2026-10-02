"use client";

import { useActionState, useState } from "react";
import { Check, Paperclip } from "lucide-react";
import { submitVerificationAction, type VerificationSubmitState } from "@/app/dashboard/verification/actions";
import { settingsInputClass } from "@/components/portal/SettingsRow";
import { formatFileSize } from "@/lib/format";
import { DOCUMENT_CATEGORIES } from "@/types/document";

export function VerificationUploadForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<VerificationSubmitState, FormData>(submitVerificationAction, {});
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);

  return (
    <form action={formAction} className="p-6">
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="verificationCategory" className="text-sm font-medium">
            Document type
          </label>
          <select
            id="verificationCategory"
            name="category"
            required
            defaultValue=""
            className={`mt-1.5 ${settingsInputClass}`}
          >
            <option value="" disabled>
              Choose a type
            </option>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="verificationFile" className="text-sm font-medium">
            File
          </label>
          <label
            htmlFor="verificationFile"
            className="mt-1.5 flex cursor-pointer items-center gap-2.5 rounded-xl bg-black/[0.025] px-3.5 py-2.5 text-sm ring-1 ring-transparent transition hover:bg-black/[0.04] focus-within:ring-primary/40"
          >
            <Paperclip className="size-4 shrink-0 text-muted" aria-hidden />
            {fileName ? (
              <span className="min-w-0 flex-1 truncate">
                {fileName}
                {fileSize ? <span className="text-muted"> · {formatFileSize(fileSize)}</span> : null}
              </span>
            ) : (
              <span className="text-muted">Choose a file to upload</span>
            )}
          </label>
          <input
            id="verificationFile"
            name="file"
            type="file"
            required
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setFileName(file?.name ?? null);
              setFileSize(file?.size);
            }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-5">
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
