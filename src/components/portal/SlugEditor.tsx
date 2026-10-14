"use client";

import { useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Link2, Pencil, TriangleAlert, X } from "lucide-react";
import { checkHandleAction, updateSlugAction } from "@/app/dashboard/profile/actions";

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

export function SlugEditor({
  slug,
  siteUrl,
  chosen = true,
  suggestion = "",
  live = true,
}: {
  slug: string;
  siteUrl: string;
  chosen?: boolean;
  suggestion?: string;
  /** Whether the public page is live. Until it is, the link is reserved and opens a "not live yet" page. */
  live?: boolean;
}) {
  // Until they choose one, the practitioner has no link at all: the field starts open and empty (or with a suggestion).
  const [isChosen, setIsChosen] = useState(chosen);
  const [currentSlug, setCurrentSlug] = useState(chosen ? slug : "");
  const [editing, setEditing] = useState(!chosen);
  const [draft, setDraft] = useState(chosen ? slug : suggestion);
  const [availability, setAvailability] = useState<{ ok: boolean; message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const domain = siteUrl.replace(/^https?:\/\//, "");
  const fullUrl = `${siteUrl.replace(/\/$/, "")}/${currentSlug}`;
  const changed = draft !== currentSlug && draft.length > 0;

  // Asks the server whether the link is free, a moment after they stop typing.
  const checkSoon = (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    setAvailability(null);
    if (!value || value === currentSlug) return;
    timer.current = setTimeout(async () => setAvailability(await checkHandleAction(value)), 350);
  };

  const startEditing = () => {
    setDraft(currentSlug);
    setError(null);
    setAvailability(null);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(currentSlug);
    setError(null);
    setAvailability(null);
    setEditing(isChosen ? false : true);
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
      setError("Choose a link first.");
      return;
    }
    if (next === currentSlug) {
      cancel();
      return;
    }
    startTransition(async () => {
      const result = await updateSlugAction(next);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setCurrentSlug(next);
      setIsChosen(true);
      setEditing(false);
      setError(null);
      setAvailability(null);
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
        className={`flex flex-wrap items-center rounded-xl bg-black/[0.025] py-1 pr-1.5 pl-3.5 ring-1 transition ${
          editing ? (error ? "bg-surface ring-alert/50" : "bg-surface ring-primary/40") : "ring-transparent"
        }`}
      >
        {/* The URL itself and its buttons are two groups, so on a narrow screen the buttons drop to their own line instead of overflowing. */}
        <div className="flex min-w-0 flex-1 basis-44 items-center">
        <Link2 className="mr-1.5 size-4 shrink-0 text-muted" aria-hidden />
        <span className="shrink-0 text-sm text-muted">{domain}/</span>

        {editing ? (
          <input
            value={draft}
            onChange={(e) => {
              const value = sanitizeSlug(e.target.value);
              setDraft(value);
              setError(null);
              checkSoon(value);
            }}
            onKeyDown={onKeyDown}
            autoFocus
            disabled={pending}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            aria-label="Public profile link"
            aria-invalid={error ? true : undefined}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm font-medium outline-none disabled:opacity-60"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate py-1.5 text-sm font-medium">{currentSlug}</span>
        )}
        </div>

        <div className="ml-auto flex shrink-0 items-center">
        {editing ? (
          <>
            <button
              type="button"
              onClick={save}
              disabled={pending || !changed}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <Check className="size-3.5" aria-hidden />
              {pending ? "Saving…" : isChosen ? "Save" : "Choose this link"}
            </button>
            {isChosen && (
              <button type="button" onClick={cancel} disabled={pending} aria-label="Cancel" className={iconButton}>
                <X className="size-4" aria-hidden />
              </button>
            )}
          </>
        ) : (
          <>
            <ActionButton label={copied ? "Copied" : "Copy link"} onClick={copy}>
              {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            </ActionButton>
            {/* Always the real link, the same address that is copied and shown. Until the profile is live, it opens the
                "not live yet" page clients would see. The private preview has its own button at the top of the page. */}
            <a
              href={`/${currentSlug}`}
              target="_blank"
              rel="noopener"
              aria-label={live ? "Open your public page" : "Open your link. It isn't live yet."}
              title={live ? "Open your public page" : "Open your link. It isn't live yet."}
              className={iconButton}
            >
              <ExternalLink className="size-4" aria-hidden />
            </a>
            <ActionButton label="Edit link" onClick={startEditing}>
              <Pencil className="size-4" aria-hidden />
            </ActionButton>
          </>
        )}
        </div>
      </div>

      {!editing && isChosen && !live && (
        <p className="mt-2 text-xs text-muted">Reserved for you. It opens to clients once your profile is live.</p>
      )}

      {editing && (
        <div className="mt-2 space-y-1.5 text-xs">
          {error ? (
            <p className="text-alert">{error}</p>
          ) : availability ? (
            <p className={availability.ok ? "text-success" : "text-alert"}>{availability.message}</p>
          ) : (
            <p className="text-muted">
              3 to 30 characters: lowercase letters, numbers and hyphens.
            </p>
          )}
          {isChosen && changed && !error && (
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
