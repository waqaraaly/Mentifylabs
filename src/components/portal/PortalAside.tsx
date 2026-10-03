"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

/**
 * The portal sidebar's contents. From `lg` up it's the usual always-open sidebar. Below that it collapses
 * to a slim bar (logo + menu button) so the page content starts right under it instead of below a
 * screen-tall list of links. The bar stays pinned while scrolling, and the menu closes after a link is tapped.
 */
export function PortalAside({ logo, children }: { logo: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:block lg:px-6 lg:py-6">
        {logo}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="portal-menu"
          className="flex size-11 items-center justify-center rounded-lg text-sidebar-fg transition hover:bg-sidebar-active hover:text-sidebar-active-fg lg:hidden"
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>

      <div
        id="portal-menu"
        // Tapping any link inside closes the menu; the page itself navigates normally.
        onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
        className={`${open ? "flex" : "hidden"} flex-col lg:flex lg:flex-1`}
      >
        {children}
      </div>
    </>
  );
}
