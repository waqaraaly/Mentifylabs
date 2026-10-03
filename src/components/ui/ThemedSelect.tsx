"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  /** Shown on the button once chosen. */
  label: string;
  /** Extra text in the open list only, e.g. a currency's full name. */
  detail?: string;
}

const DEFAULT_TRIGGER =
  "inline-flex cursor-pointer items-center gap-3 rounded-lg bg-surface py-2.5 pr-3.5 pl-4 text-sm font-semibold ring-1 ring-black/[0.14] transition hover:bg-black/[0.03]";

/**
 * A dropdown drawn in our own colours, since a browser <select> opens a list the operating system paints in its
 * own blue. Works inside a form (give it a `name` and it submits like a normal field) or on its own with `onChange`.
 */
export function ThemedSelect({
  options,
  value,
  defaultValue,
  name,
  id,
  onChange,
  ariaLabel,
  triggerClassName = DEFAULT_TRIGGER,
  align = "left",
  openUp = false,
}: {
  options: SelectOption[];
  /** Controlled value. Omit it and use `defaultValue` to let the dropdown keep its own. */
  value?: string;
  defaultValue?: string;
  name?: string;
  id?: string;
  onChange?: (value: string) => void;
  ariaLabel: string;
  triggerClassName?: string;
  align?: "left" | "right";
  /** Open the list above the button, for a field near the bottom of a clipped card. */
  openUp?: boolean;
}) {
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? "");
  const current = value ?? inner;
  const selected = Math.max(0, options.findIndex((o) => o.value === current));
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(selected);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const uid = useId();

  // Click or tap anywhere outside closes it.
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Keep the highlighted option in view in a long list.
  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  const choose = (index: number) => {
    setOpen(false);
    const next = options[index];
    if (!next) return;
    if (value === undefined) setInner(next.value);
    if (next.value !== current) onChange?.(next.value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Escape" || e.key === "Tab") return setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setHighlight(selected);
        return setOpen(true);
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      return setHighlight((h) => (h + step + options.length) % options.length);
    }
    if (e.key === "Home" || e.key === "End") {
      if (!open) return;
      e.preventDefault();
      return setHighlight(e.key === "Home" ? 0 : options.length - 1);
    }
    if (e.key === "Enter" || e.key === " ") {
      // Enter must not submit the surrounding form while the list is the thing being operated.
      e.preventDefault();
      if (open) choose(highlight);
      else {
        setHighlight(selected);
        setOpen(true);
      }
    }
  };

  return (
    <div ref={root} className="relative">
      {name && <input type="hidden" name={name} value={current} />}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-activedescendant={open ? `${uid}-${highlight}` : undefined}
        onClick={() => {
          setHighlight(selected);
          setOpen((v) => !v);
        }}
        onKeyDown={onKeyDown}
        className={`${triggerClassName} outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
      >
        <span className="truncate">{options[selected]?.label}</span>
        <ChevronDown className={`ml-auto size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <ul
          ref={list}
          id={`${uid}-list`}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute z-20 max-h-64 min-w-full overflow-auto rounded-xl bg-surface p-1.5 text-sm shadow-lg ring-1 ring-black/[0.08] ${openUp ? "bottom-full mb-2" : "top-full mt-2"} ${align === "right" ? "right-0" : "left-0"}`}
        >
          {options.map((o, i) => {
            const isSelected = i === selected;
            return (
              <li
                key={o.value}
                id={`${uid}-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center gap-4 rounded-lg px-3 py-2 whitespace-nowrap transition-colors ${
                  i === highlight ? "bg-primary/[0.1] text-primary" : ""
                } ${isSelected ? "font-semibold" : ""}`}
              >
                <span>{o.label}</span>
                {o.detail && <span className="text-xs font-normal text-muted">{o.detail}</span>}
                <Check className={`ml-auto size-4 shrink-0 text-primary ${isSelected ? "" : "invisible"}`} aria-hidden />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
