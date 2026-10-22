"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * A modal for setting one's own colours. Built on the native <dialog>, so focus is trapped, Escape closes it and the
 * page behind is inert. Clicking the dimmed backdrop closes it too.
 */
export function ColorDialog({
  open,
  onClose,
  title,
  hint,
  onReset,
  canReset,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  hint: string;
  onReset: () => void;
  canReset: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // Only a click on the backdrop itself, not on anything inside the panel.
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(44rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/40"
    >
      <div className="flex max-h-[88vh] flex-col">
        <div className="flex items-start gap-4 border-b border-border px-8 py-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{hint}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition hover:bg-black/5"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-8 py-6">{children}</div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-8 py-5">
          <button
            type="button"
            disabled={!canReset}
            onClick={onReset}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-black/5 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Reset colours
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-primary px-7 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}
