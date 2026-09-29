"use client";

import type { ReactNode } from "react";
import { ChevronLeft, X } from "lucide-react";

/**
 * The single right-hand surface used across the availability screens. Views inside it (a day, a
 * slot, a weekly slot) swap in place with a back link, so nothing ever opens on top of it.
 */
export function SidePanel({
  title,
  subtitle,
  badge,
  backLabel,
  onBack,
  onClose,
  variant = "panel",
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  /** When set, a "‹ back" link shows above the title. */
  backLabel?: string;
  onBack?: () => void;
  onClose: () => void;
  /** "panel" slides in from the right; "modal" is a centred dialog. */
  variant?: "panel" | "modal";
  children: ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside
        role="dialog"
        aria-label={title}
        className={
          variant === "modal"
            ? "fixed top-1/2 left-1/2 z-50 flex max-h-[88vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-border"
            : "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl"
        }
      >
        <div className="px-7 pt-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="-ml-1 mb-1 inline-flex items-center gap-0.5 text-sm font-medium text-muted transition hover:text-foreground"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  {backLabel ?? "Back"}
                </button>
              )}
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
              {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
              {badge && <div className="mt-2">{badge}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-foreground/[0.05] hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </aside>
    </>
  );
}
