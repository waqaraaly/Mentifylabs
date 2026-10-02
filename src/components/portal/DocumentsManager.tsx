"use client";

import { useActionState } from "react";
import { Check, ExternalLink, FileText, Trash2 } from "lucide-react";
import {
  deleteDocumentAction,
  uploadDocumentAction,
  type DocumentUploadState,
} from "@/app/dashboard/settings/documentActions";
import { settingsInputClass } from "@/components/portal/SettingsRow";
import { formatFileSize } from "@/lib/format";
import { DOCUMENT_CATEGORIES, type PractitionerDocument } from "@/types/document";

export function DocumentsManager({ slug, documents }: { slug: string; documents: PractitionerDocument[] }) {
  const [state, formAction, pending] = useActionState<DocumentUploadState, FormData>(uploadDocumentAction, {});

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-5 px-6 py-6">
        <p className="text-sm text-muted">
          Licences, certificates and ID the MentifyLabs team checks before approving you. Only you and the team can see
          them.
        </p>

        {documents.length === 0 ? (
          <p className="rounded-xl bg-black/[0.03] px-4 py-3 text-sm text-muted">No documents uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-black/[0.06] rounded-xl ring-1 ring-black/[0.07]">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                <FileText className="size-4 shrink-0 text-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted">
                    {d.category}
                    {d.sizeBytes ? ` · ${formatFileSize(d.sizeBytes)}` : ""}
                  </p>
                </div>
                {d.hasFile && (
                  <a
                    href={`/documents/${d.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex size-11 items-center justify-center rounded-lg text-muted transition hover:bg-black/[0.05] hover:text-foreground"
                    title="Open"
                  >
                    <ExternalLink className="size-4" aria-hidden />
                    <span className="sr-only">Open {d.name}</span>
                  </a>
                )}
                <form action={deleteDocumentAction}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    className="flex size-11 items-center justify-center rounded-lg text-muted transition hover:bg-alert/[0.08] hover:text-alert"
                    title="Remove"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    <span className="sr-only">Remove {d.name}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={formAction} className="border-t border-black/[0.06] px-6 py-5">
        <input type="hidden" name="slug" value={slug} />
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <label className="sr-only" htmlFor="documentCategory">
            Document type
          </label>
          <select id="documentCategory" name="category" required defaultValue="" className={settingsInputClass}>
            <option value="" disabled>
              Document type
            </option>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="documentFile">
            File
          </label>
          <input
            id="documentFile"
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
            {pending ? "Uploading…" : "Upload document"}
          </button>
        </div>
        {state.error && (
          <p role="alert" className="mt-3 text-sm font-medium text-alert">
            {state.error}
          </p>
        )}
        {state.uploaded && !pending && (
          <p role="status" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary">
            <Check className="size-4" aria-hidden />
            Uploaded {state.uploaded}
          </p>
        )}
      </form>
    </div>
  );
}
