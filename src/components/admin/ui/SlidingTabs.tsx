"use client";

import { useLayoutEffect, useRef, useState } from "react";

export interface SlidingTab<T extends string> {
  id: T;
  label: string;
  /** A small count shown beside the label. */
  count?: number;
  /** A small dot beside the label, for something waiting on the reader. */
  attention?: boolean;
}

/**
 * Tabs on a baseline, with one accent bar that slides under whichever tab is active.
 * The baseline runs the full width of whatever it sits on, so the tabs read as the top edge of the content below.
 */
export function SlidingTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: SlidingTab<T>[];
  value: T;
  onChange: (id: T) => void;
  label?: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const refs = useRef(new Map<T, HTMLButtonElement>());
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current.get(value);
      if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (barRef.current) observer.observe(barRef.current);
    return () => observer.disconnect();
  }, [value, tabs]);

  return (
    <div className="slide-tabs" role="tablist" aria-label={label} ref={barRef}>
      {tabs.map((t) => (
        <button
          key={t.id}
          ref={(el) => {
            if (el) refs.current.set(t.id, el);
            else refs.current.delete(t.id);
          }}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={"slide-tab" + (value === t.id ? " active" : "")}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          {t.count !== undefined && <span className="slide-count tnum">{t.count}</span>}
          {t.attention && <span className="slide-dot" role="img" aria-label="Needs attention" />}
        </button>
      ))}
      <span
        className="slide-ind"
        aria-hidden
        style={bar ? { left: bar.left, width: bar.width, opacity: 1 } : { opacity: 0 }}
      />
    </div>
  );
}
