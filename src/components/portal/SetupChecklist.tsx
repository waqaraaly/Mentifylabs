import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import type { ChecklistItem } from "@/lib/setupChecklist";

/**
 * What is left before the profile is ready for clients, with each item linking to the place it is done. It leaves the
 * dashboard on its own once everything is done. Items still to do come first, so the next step is always at the top.
 */
export function SetupChecklist({ items, done, total }: { items: ChecklistItem[]; done: number; total: number }) {
  if (done >= total) return null;

  const todo = items.filter((i) => !i.done);
  const finished = items.filter((i) => i.done);

  return (
    <section aria-labelledby="setup-checklist-title" className="rounded-2xl bg-surface ring-1 ring-black/[0.07]">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-6 pt-5 pb-4">
        <div>
          <h2 id="setup-checklist-title" className="text-base font-semibold tracking-tight">
            Get your profile ready
          </h2>
          <p className="mt-0.5 text-sm text-muted">What clients need before they can find and book you.</p>
        </div>
        <p className="text-sm font-medium text-muted tabular-nums">
          {done} of {total} done
        </p>
      </div>

      <div className="mx-6 h-1 overflow-hidden rounded-full bg-black/[0.07]" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Setup progress">
        <div className="h-full rounded-full bg-primary" style={{ width: `${(done / total) * 100}%` }} />
      </div>

      <ul className="grid gap-x-8 px-3 pt-3 pb-3 md:grid-cols-2">
        {[...todo, ...finished].map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="group flex items-center gap-3.5 rounded-xl px-3 py-3 transition hover:bg-black/[0.03]"
            >
              <span
                aria-hidden
                className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                  item.done ? "bg-primary text-primary-foreground" : "ring-[1.5px] ring-inset ring-black/[0.2]"
                }`}
              >
                {item.done && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${item.done ? "text-muted" : ""}`}>
                  {item.label}
                  {item.done && <span className="sr-only"> (done)</span>}
                </span>
                <span className="block truncate text-xs text-muted">{item.hint}</span>
              </span>
              {!item.done && (
                <ChevronRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5" aria-hidden />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
