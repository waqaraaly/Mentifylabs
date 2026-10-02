"use client";

import { useActionState } from "react";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { publishProfileAction, type PublishProfileState } from "@/app/dashboard/profile/actions";

export function PublishProfileButton({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<PublishProfileState, FormData>(publishProfileAction, {});

  return (
    <div className="flex flex-col items-end gap-2">
      <form action={formAction}>
        <input type="hidden" name="slug" value={slug} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Publishing…" : "Publish profile"}
          <ArrowUpRight className="size-4" aria-hidden />
        </button>
      </form>
      {state.error && (
        <p role="alert" className="flex max-w-xs items-start gap-1.5 text-right text-xs font-medium text-alert">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {state.error}{" "}
            <Link href="/dashboard/verification" className="underline underline-offset-2">
              Verify now
            </Link>
          </span>
        </p>
      )}
    </div>
  );
}
