"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { formatFileSize } from "@/lib/format";
import { DOCUMENT_ACCEPT, MAX_CREDENTIAL_BATCH_BYTES, MAX_DOCUMENT_BYTES } from "@/lib/documentLimits";
import { CREDENTIAL_TYPES, type DocumentCategory } from "@/types/document";

/** The form field names the server reads. They match `lib/credentialUploads.ts`. */
const CATEGORY_FIELD = "credentialCategory";
const fileField = (category: string) => `credentialFile:${category}`;

/**
 * What is ticked and which file goes with each. The form owns this, so it can switch its Submit button on only when
 * something is ticked and every ticked option has a file it can use.
 */
export function useCredentialPicker() {
  const [selected, setSelected] = useState<DocumentCategory[]>([]);
  const [files, setFiles] = useState<Partial<Record<DocumentCategory, File>>>({});

  const toggle = (category: DocumentCategory) => {
    setSelected((current) => (current.includes(category) ? current.filter((c) => c !== category) : [...current, category]));
    // Unticking an option drops its file: its file field leaves the form with it.
    setFiles((current) => {
      if (!(category in current)) return current;
      const next = { ...current };
      delete next[category];
      return next;
    });
  };

  const setFile = (category: DocumentCategory, file: File | undefined) =>
    setFiles((current) => {
      const next = { ...current };
      if (file) next[category] = file;
      else delete next[category];
      return next;
    });

  const incomplete = selected.some((category) => !files[category]);
  const total = selected.reduce((sum, category) => sum + (files[category]?.size ?? 0), 0);
  const tooBig = selected.find((category) => (files[category]?.size ?? 0) > MAX_DOCUMENT_BYTES);
  const problem = tooBig
    ? `${tooBig}: that file is over 10 MB.`
    : total > MAX_CREDENTIAL_BATCH_BYTES
      ? "Your files add up to more than 30 MB. Use smaller files."
      : null;

  return {
    selected,
    files,
    toggle,
    setFile,
    /** Something is ticked without a file yet. */
    incomplete,
    /** A file or the total is too big. */
    problem,
    /** Ticked, every ticked option has a file, and nothing is too big. */
    ready: selected.length > 0 && !incomplete && !problem,
  };
}

const TONES = {
  portal: {
    // The one-line explanation under each option. Setup keeps the list to the names alone.
    hints: true,
    option: "rounded-xl bg-black/[0.025] ring-1 ring-transparent transition",
    optionOn: "bg-primary/[0.05] ring-primary/40",
    file: "flex cursor-pointer items-center gap-2.5 rounded-lg bg-surface px-3.5 py-2.5 text-sm ring-1 ring-black/[0.08] transition hover:ring-primary/40 focus-within:ring-primary/40",
  },
  wizard: {
    hints: false,
    option: "rounded-xl border border-border transition",
    optionOn: "border-primary bg-primary/[0.04]",
    file: "flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-border px-3.5 py-2.5 text-sm transition hover:border-primary/40 focus-within:border-primary",
  },
} as const;

/**
 * A checklist of the ways to verify: tick one or more, and a file field appears under each one ticked. The ticks and
 * files are ordinary form fields, so the surrounding form posts them as they are.
 */
export function CredentialPicker({ picker, tone = "portal" }: { picker: ReturnType<typeof useCredentialPicker>; tone?: keyof typeof TONES }) {
  const look = TONES[tone];

  return (
    <div>
      <ul className="space-y-2.5">
        {CREDENTIAL_TYPES.map(({ category, hint }) => {
          const on = picker.selected.includes(category);
          const file = picker.files[category];
          return (
            <li key={category} className={`${look.option} ${on ? look.optionOn : ""}`}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-3.5">
                <input
                  type="checkbox"
                  name={CATEGORY_FIELD}
                  value={category}
                  checked={on}
                  onChange={() => picker.toggle(category)}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{category}</span>
                  {look.hints && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{hint}</span>}
                </span>
              </label>

              {on && (
                <div className="px-4 pb-4 pl-[2.75rem]">
                  <label className={look.file}>
                    <Paperclip className="size-4 shrink-0 text-muted" aria-hidden />
                    {file ? (
                      <span className="min-w-0 flex-1 truncate">
                        {file.name}
                        <span className="text-muted"> · {formatFileSize(file.size)}</span>
                      </span>
                    ) : (
                      <span className="text-muted">Add a file for {category}</span>
                    )}
                    <input
                      type="file"
                      name={fileField(category)}
                      required
                      accept={DOCUMENT_ACCEPT}
                      className="sr-only"
                      onChange={(e) => picker.setFile(category, e.target.files?.[0])}
                    />
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {picker.problem ? (
        <p role="alert" className="mt-3 text-sm font-medium text-alert">
          {picker.problem}
        </p>
      ) : picker.incomplete ? (
        <p className="mt-3 text-xs text-muted">Add a file for each option you ticked, or untick the ones you don&apos;t have.</p>
      ) : null}
    </div>
  );
}
