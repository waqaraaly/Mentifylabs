"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { FEATURE_PAGES } from "@/lib/featurePages";

/**
 * "Features" in the top bar: a button that opens a panel listing every feature page. It opens on click or on hover
 * (with a short grace period so the pointer can travel into the panel), and closes on Escape, on a click outside
 * and when a page is chosen.
 */
export function FeaturesMenu() {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const leaving = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const enter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (leaving.current) clearTimeout(leaving.current);
    setOpen(true);
  };
  const leave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    leaving.current = setTimeout(() => setOpen(false), 160);
  };

  return (
    <div ref={wrap} className="relative" onPointerEnter={enter} onPointerLeave={leave}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition hover:bg-black/5 hover:text-(--ink) ${open || pathname.startsWith("/features") ? "text-(--ink)" : "text-(--quiet)"}`}
      >
        Features
        <svg aria-hidden viewBox="0 0 16 16" className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute top-full left-1/2 z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 pt-3"
      >
        <div className="rounded-3xl bg-white p-3 shadow-[0_0_0_1px_var(--hair),0_30px_60px_-30px_rgba(31,38,23,0.4)] motion-safe:animate-[flow-in_.3s_cubic-bezier(.2,.8,.2,1)_both]">
          <ul className="grid gap-1 sm:grid-cols-2">
            {FEATURE_PAGES.map((f) => {
              const here = pathname === `/features/${f.slug}`;
              return (
                <li key={f.slug}>
                  <Link
                    href={`/features/${f.slug}`}
                    aria-current={here ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex items-start gap-3 rounded-2xl px-3.5 py-3 transition hover:bg-[#f6f7f1] ${here ? "bg-[#f6f7f1]" : ""}`}
                  >
                    <span aria-hidden className={`mt-[7px] size-2 shrink-0 rounded-full ${here ? "bg-(--glow)" : "bg-(--sage-edge)"}`} />
                    <span>
                      <span className="block text-[14.5px] font-semibold text-(--ink)">{f.name}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-(--quiet)">{f.blurb}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/#in-action"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-between rounded-2xl bg-(--sage) px-4 py-3 text-[14px] font-medium text-(--moss) transition hover:bg-[#dfe7cb]"
          >
            See every feature on one page
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
