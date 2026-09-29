"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * A horizontally scrolling row with the scrollbar hidden. Round arrow buttons
 * in the theme accent appear only in the direction there's still more to see,
 * and disappear when everything already fits.
 */
export function ArrowScroller({
  children,
  className = "",
  compact = false,
}: {
  children: ReactNode;
  /** Classes for the scrolling element itself (flex/gap etc.). */
  className?: string;
  /** Smaller buttons that sit closer to the edge, for tight spaces like a modal. */
  compact?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  // Runs after every render so it also catches the children changing (e.g. a
  // different set of dates); setting an unchanged state value is a no-op.
  useEffect(() => {
    updateArrows();
  });

  // A ResizeObserver (rather than just a window resize listener) also covers
  // the row being revealed after mount — e.g. inside a <dialog> that is
  // display:none, so it measured 0 wide, until it was opened.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [updateArrows]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: "smooth" });
  };

  const arrowClass = `absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-(--pt-accent) bg-white text-(--pt-accent) shadow-[0_10px_24px_-10px_rgba(32,34,31,0.35)] transition hover:bg-(--pt-accent) hover:text-(--pt-accent-foreground) ${
    compact ? "size-9" : "size-11"
  }`;
  const iconClass = compact ? "size-5" : "size-6";

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label="Show earlier"
          className={`${arrowClass} ${compact ? "-left-2" : "-left-3 sm:-left-5"}`}
        >
          <ChevronLeft className={iconClass} aria-hidden />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label="Show more"
          className={`${arrowClass} ${compact ? "-right-2" : "-right-3 sm:-right-5"}`}
        >
          <ChevronRight className={iconClass} aria-hidden />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className={`overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
