"use client";

import { useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Link2, Pencil, TriangleAlert, X } from "lucide-react";
import { updateSlugAction } from "@/app/dashboard/profile/actions";

const iconButton =
  "ml-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-black/[0.06] hover:text-foreground disabled:opacity-60";

/** Lowercase letters, digits and single hyphens only — what a URL slug can safely be. */
function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-");
}

function ActionButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={iconButton}>
      {children}
    </button>
  );
}

export function SlugEditor({ slug, siteUrl }: { slug: string; siteUrl: string }) {
  const [currentSlug, setCurrentSlug] = useState(slug);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(slug);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const domain = siteUrl.replace(/^https?:\/\//, "");
  const fullUrl = `${siteUrl.replace(/\/$/, "")}/${currentSlug}`;
  const changed = draft !== currentSlug;

  const startEditing = () => {
    setDraft(currentSlug);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(currentSlug);
    setError(null);
    setEditing(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser; fail silently.
    }
  };

  const save = () => {
    const next = draft.replace(/^-+|-+$/g, "");
    if (!next) {
      setError("Your URL can't be empty.");
      return;
    }
    if (next === currentSlug) {
      cancel();
      return;
    }
    startTransition(async () => {
      const result = await updateSlugAction(currentSlug, next);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setCurrentSlug(next);
      setEditing(false);
      setError(null);
      router.refresh();
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // this lives inside the profile <form>
      save();
    }
    if (e.key === "Escape") cancel();
  };

  return (
    <div>
      <div
        className={`flex items-center rounded-xl bg-black/[0.025] py-1 pr-1.5 pl-3.5 ring-1 transition ${
          editing ? (error ? "bg-surface ring-alert/50" : "bg-surface ring-primary/40") : "ring-transparent"
        }`}
      >
        <Link2 className="mr-1.5 size-4 shrink-0 text-muted" aria-hidden />
        <span className="shrink-0 text-sm text-muted">{domain}/</span>

        {editing ? (
          <input
            value={draft}
            onChange={(e) => {
              setDraft(sanitizeSlug(e.target.value));
              setError(null);
            }}
            onKeyDown={onKeyDown}
            autoFocus
            disabled={pending}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            aria-label="Public URL slug"
            aria-invalid={error ? true : undefined}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm font-medium outline-none disabled:opacity-60"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate py-1.5 text-sm font-medium">{currentSlug}</span>
        )}

        {editing ? (
          <>
            <button
              type="button"
              onClick={save}
              disabled={pending || !changed}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <Check className="size-3.5" aria-hidden />
              {pending ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancel} disabled={pending} aria-label="Cancel" className={iconButton}>
              <X className="size-4" aria-hidden />
            </button>
          </>
        ) : (
          <>
            <ActionButton label={copied ? "Copied" : "Copy link"} onClick={copy}>
              {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            </ActionButton>
            <a
              href={`/${currentSlug}`}
              target="_blank"
              rel="noopener"
              aria-label="Open your public page"
              title="Open your public page"
              className={iconButton}
            >
              <ExternalLink className="size-4" aria-hidden />
            </a>
            <ActionButton label="Edit URL" onClick={startEditing}>
              <Pencil className="size-4" aria-hidden />
            </ActionButton>
          </>
        )}
      </div>

      {editing && (
        <div className="mt-2 space-y-1.5 text-xs">
          {error ? (
            <p className="text-alert">{error}</p>
          ) : (
            <p className="text-muted">Lowercase letters, numbers and hyphens only.</p>
          )}
          {changed && !error && (
            <p className="flex items-start gap-1.5 text-muted">
              <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
              <span>
                Your old link (<span className="font-medium">{domain}/{currentSlug}</span>) will stop working.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
