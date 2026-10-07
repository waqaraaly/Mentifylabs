"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { ScaledProfile } from "@/components/practitioner/ScaledProfile";
import { parseProfileForm } from "@/lib/profileForm";
import type { Practitioner } from "@/types/practitioner";

const KEY = "ml_live_preview";
const EVENT = "ml-live-preview";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** What they last chose, otherwise open on a wide screen (there is room beside the form) and closed on a narrow one. */
function readOpen(): boolean {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "open") return true;
    if (saved === "closed") return false;
  } catch {
    /* no memory of the choice: fall through to the default */
  }
  return window.matchMedia("(min-width: 1536px)").matches;
}

const LiveContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

function useLive() {
  const live = useContext(LiveContext);
  if (!live) throw new Error("The live preview toggle needs the LiveProfileEditor around it.");
  return live;
}

/** The button that shows or hides the live preview. Lives in the page header. */
export function LivePreviewToggle() {
  const { open, setOpen } = useLive();
  const Icon = open ? EyeOff : Eye;
  return (
    <button
      type="button"
      aria-pressed={open}
      onClick={() => setOpen(!open)}
      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold ring-1 ring-black/[0.14] transition hover:bg-black/[0.04]"
    >
      <Icon className="size-4" aria-hidden />
      {open ? "Hide live preview" : "Live preview"}
    </button>
  );
}

/**
 * Wraps the profile editor and draws the profile beside it as it is being edited. It reads the form itself, the same way
 * Save does (through parseProfileForm), so the preview shows what would be stored. Nothing is saved or sent while typing.
 */
export function LiveProfileEditor({ practitioner, formId, children }: { practitioner: Practitioner; formId: string; children: ReactNode }) {
  const open = useSyncExternalStore(subscribe, readOpen, () => false);
  const setOpen = (next: boolean) => {
    try {
      localStorage.setItem(KEY, next ? "open" : "closed");
    } catch {
      /* the choice just isn't remembered */
    }
    window.dispatchEvent(new Event(EVENT));
  };

  // What the form says right now. Until anything changes, the profile is simply the saved one.
  const [edits, setEdits] = useState<Partial<Practitioner> | null>(null);
  useEffect(() => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    let frame = 0;
    const read = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setEdits(parseProfileForm(new FormData(form), practitioner.feeRange.currency)));
    };
    form.addEventListener("input", read);
    form.addEventListener("change", read);
    // The lists, contacts and colour picker keep their values in hidden fields that change without any event.
    const watcher = new MutationObserver(read);
    watcher.observe(form, { subtree: true, childList: true, attributes: true, attributeFilter: ["value", "checked"] });
    return () => {
      cancelAnimationFrame(frame);
      form.removeEventListener("input", read);
      form.removeEventListener("change", read);
      watcher.disconnect();
    };
  }, [formId, practitioner.feeRange.currency]);

  const shown: Practitioner = { ...practitioner, ...edits };
  const live = practitioner.profileStatus === "published";

  return (
    <LiveContext.Provider value={{ open, setOpen }}>
      <div data-live={open ? "open" : "closed"} className={open ? "xl:pr-[460px] 2xl:pr-[560px]" : ""}>
        {children}
      </div>

      {open && (
        <aside
          aria-label="Live preview of your public profile"
          className="fixed inset-0 z-40 flex flex-col bg-background xl:inset-auto xl:top-0 xl:right-0 xl:bottom-0 xl:w-[440px] xl:border-l xl:border-black/[0.08] xl:shadow-[-24px_0_40px_-32px_rgba(31,38,23,0.35)] 2xl:w-[540px]"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/[0.08] px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Live preview</h2>
              <p className="mt-0.5 text-xs text-muted">Updates as you type. Nothing is saved until you press Save changes.</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <a
                href={live ? `/${practitioner.slug}` : `/preview/${practitioner.slug}`}
                target="_blank"
                rel="noopener"
                className="rounded-lg px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/[0.08]"
              >
                {live ? "Open live page" : "Open full size"}
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close live preview"
                className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-black/[0.06] hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <ScaledProfile practitioner={shown} />
          </div>
          <p className="shrink-0 border-t border-black/[0.08] px-5 py-2.5 text-center text-[11px] text-muted">Your photo and profile link update when you save them.</p>
        </aside>
      )}
    </LiveContext.Provider>
  );
}
