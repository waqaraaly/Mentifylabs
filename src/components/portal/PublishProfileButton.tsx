"use client";

import { useActionState } from "react";
import { AlertTriangle, ArrowUpRight, Lock } from "lucide-react";
import Link from "next/link";
import { publishProfileAction, type PublishProfileState } from "@/app/dashboard/profile/actions";

/**
 * The practitioner's own Publish button. When publishing isn't allowed yet it stays visible but disabled,
 * with the reason beside it (and a link to fix it), so nobody has to click to find out why.
 */
export function PublishProfileButton({
  slug,
  blockedReason,
  fixHref,
}: {
  slug: string;
  /** Why publishing isn't possible right now, or null when it is. */
  blockedReason: string | null;
  /** Where to go to resolve the reason, e.g. the Verification page. */
  fixHref?: string;
}) {
  const [state, formAction, pending] = useActionState<PublishProfileState, FormData>(publishProfileAction, {});
  const blocked = blockedReason !== null;

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={formAction}>
        <input type="hidden" name="slug" value={slug} />
        <button
          type="submit"
          disabled={pending || blocked}
          title={blockedReason ?? undefined}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {blocked ? <Lock className="size-4" aria-hidden /> : null}
          {pending ? "Publishing…" : "Publish profile"}
          {!blocked && <ArrowUpRight className="size-4" aria-hidden />}
        </button>
      </form>

      {blocked && (
        <p className="flex max-w-xs items-start gap-1.5 text-right text-xs leading-relaxed text-muted">
          <span>
            {blockedReason}
            {fixHref && (
              <>
                {" "}
                <Link href={fixHref} className="font-medium text-primary underline underline-offset-2">
                  Open Verification
                </Link>
              </>
            )}
          </span>
        </p>
      )}

      {state.error && (
        <p role="alert" className="flex max-w-xs items-start gap-1.5 text-right text-xs font-medium text-alert">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </p>
      )}
    </div>
  );
}
