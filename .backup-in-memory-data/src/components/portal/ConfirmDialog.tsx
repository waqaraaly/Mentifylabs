"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = "default",
  pending,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "default" | "danger";
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-border">
        <div className="flex items-start gap-3.5">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${
              tone === "danger" ? "bg-alert/[0.1] text-alert" : "bg-primary/[0.1] text-primary"
            }`}
          >
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted ring-1 ring-border transition hover:bg-foreground/[0.05] disabled:opacity-60"
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-60 ${
              tone === "danger"
                ? "bg-alert text-alert-foreground hover:opacity-90"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
