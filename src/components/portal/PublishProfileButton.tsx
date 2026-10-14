"use client";

import { useActionState, useId } from "react";
import { AlertTriangle, ArrowUpRight, Lock } from "lucide-react";
import Link from "next/link";
import { publishProfileAction, type PublishProfileState } from "@/app/dashboard/profile/actions";

/**
 * The practitioner's own Publish button. When publishing isn't allowed yet it stays visible but disabled. The reason,
 * and a link to fix it, appear only while the button is hovered or focused, so the page stays quiet until someone asks.
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
  const reasonId = useId();

  return (
    <div className="flex flex-col items-end gap-2">
      {/* The button and its reason share one hover area, so the pointer can move from one onto the link inside the other. */}
      <div className="group relative">
        <form action={formAction}>
          <input type="hidden" name="slug" value={slug} />
          {/* aria-disabled rather than disabled: a disabled button can't be hovered or focused, so it couldn't show why. */}
          <button
            type="submit"
            disabled={pending}
            aria-disabled={blocked || pending}
            aria-describedby={blocked ? reasonId : undefined}
            onClick={(e) => {
              if (blocked) e.preventDefault();
            }}
            className={`inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition disabled:opacity-50 ${
              blocked ? "cursor-not-allowed opacity-50" : "hover:opacity-90"
            }`}
          >
            {blocked ? <Lock className="size-4" aria-hidden /> : null}
            {pending ? "Publishing…" : "Publish profile"}
            {!blocked && <ArrowUpRight className="size-4" aria-hidden />}
          </button>
        </form>

        {blocked && (
          <div
            id={reasonId}
            role="tooltip"
            className="invisible absolute top-full right-0 z-20 w-72 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
          >
            <p className="rounded-xl bg-surface p-3.5 text-left text-xs leading-relaxed text-muted shadow-lg ring-1 ring-black/[0.08]">
              {blockedReason}
              {fixHref && (
                <>
                  {" "}
                  <Link href={fixHref} className="font-medium text-primary underline underline-offset-2">
                    Open Verification
                  </Link>
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {state.error && (
        <p role="alert" className="flex max-w-xs items-start gap-1.5 text-right text-xs font-medium text-alert">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </p>
      )}
    </div>
  );
}
