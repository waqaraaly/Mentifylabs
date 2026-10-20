"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface FontOption {
  id: string;
  name: string;
  /** CSS font-family value the name is drawn in, so each option shows its own lettering. */
  family: string;
  weight?: number;
  note?: string;
}

/**
 * A dropdown for choosing a typeface. The closed field and every option are drawn in their own lettering. Opens with a
 * click or the arrow keys, closes on a choice, Escape or a click elsewhere.
 */
export function FontSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FontOption[];
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  function choose(id: string) {
    onChange(id);
    setOpen(false);
  }

  function step(e: React.KeyboardEvent, by: number) {
    e.preventDefault();
    if (!open) return setOpen(true);
    const next =
      options[
        (options.indexOf(current) + by + options.length) % options.length
      ];
    onChange(next.id);
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") step(e, 1);
          else if (e.key === "ArrowUp") step(e, -1);
          else if (e.key === "Escape") setOpen(false);
        }}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-surface px-4 py-3 text-left ring-1 ring-black/[0.12] transition hover:ring-black/25 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <span
          className="text-xl leading-none"
          style={{ fontFamily: current.family, fontWeight: current.weight }}
        >
          Aa
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {current.name}
        </span>
        {current.note && (
          <span className="text-xs text-muted">{current.note}</span>
        )}
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-1.5 max-h-72 w-full overflow-auto rounded-xl bg-surface p-1.5 shadow-lg ring-1 ring-black/[0.12]"
        >
          {options.map((o) => {
            const on = o.id === current.id;
            return (
              <li key={o.id} role="option" aria-selected={on}>
                <button
                  type="button"
                  onClick={() => choose(o.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-black/[0.05] ${on ? "bg-black/[0.04]" : ""}`}
                >
                  <span
                    className="w-9 text-xl leading-none"
                    style={{ fontFamily: o.family, fontWeight: o.weight }}
                  >
                    Aa
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate text-sm"
                    style={{ fontFamily: o.family, fontWeight: o.weight }}
                  >
                    {o.name}
                  </span>
                  {o.note && (
                    <span className="text-xs text-muted">{o.note}</span>
                  )}
                  {on && (
                    <Check
                      className="size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
