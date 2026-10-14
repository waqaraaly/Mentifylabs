"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, Lightbulb, LogOut } from "lucide-react";
import { PractitionerAvatar } from "@/components/portal/PractitionerAvatar";

/**
 * The practitioner's picture and name at the foot of the portal sidebar, with their role under it. Clicking it opens a small menu
 * upwards with the two things that used to sit loose in the sidebar: the suggestion form, and signing out.
 */
export function AccountMenu({ name, photoUrl, signOutAction }: { name: string; photoUrl?: string; signOutAction: () => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Close when the visitor clicks elsewhere or presses Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-sidebar-fg transition hover:bg-sidebar-active hover:text-sidebar-active-fg";

  return (
    <div ref={root} className="relative border-t-2 border-sidebar-border px-3 py-3">
      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="bg-sidebar border-sidebar-border absolute right-3 bottom-[calc(100%-0.25rem)] left-3 z-40 rounded-xl border-2 p-1.5 shadow-lg"
        >
          {/* It opens the suggestion form in a new tab, as the link in the sidebar did. */}
          <a href="/dashboard/suggestions" target="_blank" rel="noopener" role="menuitem" onClick={() => setOpen(false)} className={item}>
            <Lightbulb className="size-4 shrink-0" aria-hidden />
            Suggestions
          </a>
          <form action={signOutAction}>
            <button type="submit" role="menuitem" className={item}>
              <LogOut className="size-4 shrink-0" aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-sidebar-active"
      >
        <PractitionerAvatar name={name} photoUrl={photoUrl} className="size-11" />
        <span className="min-w-0 flex-1">
          <span className="text-sidebar-strong block truncate text-lg leading-tight font-semibold">{name}</span>
          <span className="text-sidebar-fg mt-0.5 block text-xs">Practitioner</span>
        </span>
        <ChevronUp className={`text-sidebar-fg size-4 shrink-0 transition ${open ? "" : "rotate-180"}`} aria-hidden />
      </button>
    </div>
  );
}
