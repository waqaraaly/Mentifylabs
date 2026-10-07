"use client";

import { memo, useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  /** Shown on the button once chosen. */
  label: string;
  /** Extra text in the open list only, e.g. a currency's full name. */
  detail?: string;
}

/**
 * One row of the open list. It is its own memoised component so that moving the highlight redraws two rows, not all of
 * them: a list of hundreds (every time zone) would otherwise stutter on every hover. Rows off the screen are skipped by
 * the browser's layout and painting until they scroll into view.
 */
const Row = memo(function Row({
  option,
  index,
  id,
  highlighted,
  selected,
  onHover,
  onChoose,
}: {
  option: SelectOption;
  index: number;
  id: string;
  highlighted: boolean;
  selected: boolean;
  onHover: (index: number) => void;
  onChoose: (index: number) => void;
}) {
  return (
    <li
      id={id}
      data-index={index}
      role="option"
      aria-selected={selected}
      onMouseEnter={() => onHover(index)}
      onClick={() => onChoose(index)}
      className={`flex h-9 cursor-pointer items-center gap-4 rounded-lg px-3 whitespace-nowrap transition-colors ${
        highlighted ? "bg-primary/[0.1] text-primary" : ""
      } ${selected ? "font-semibold" : ""}`}
    >
      <span className="truncate">{option.label}</span>
      {option.detail && <span className="text-xs font-normal text-muted">{option.detail}</span>}
      <Check className={`ml-auto size-4 shrink-0 text-primary ${selected ? "" : "invisible"}`} aria-hidden />
    </li>
  );
});

// A long list (every time zone) draws only the rows in view, plus a few spare either side, and fills in the rest as it
// scrolls. Every row is the same height, which is what lets the rest be stood in for by empty space.
const ROW_HEIGHT = 36;
const LIST_PADDING = 6;
const SPARE_ROWS = 6;
const DRAWN_ROWS = 8 + 2 * SPARE_ROWS;
const WINDOWED_FROM = 80;

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
  listMaxHeightClass = "max-h-64",
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
  /** How tall the open list may get before it scrolls, as a Tailwind class. A short list suits a field near the bottom of a card. */
  listMaxHeightClass?: string;
}) {
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? "");
  const current = value ?? inner;
  const selected = Math.max(0, options.findIndex((o) => o.value === current));
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(selected);
  // For a long list: the row at the top of the scroll, which decides which rows are drawn.
  const [top, setTop] = useState(0);
  const windowed = options.length > WINDOWED_FROM;
  const first = windowed ? Math.max(0, Math.min(top - SPARE_ROWS, options.length - DRAWN_ROWS)) : 0;
  const last = windowed ? Math.min(options.length, first + DRAWN_ROWS) : options.length;
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

  // Keep the highlighted option in view in a long list, but only when the keyboard moved it or the list just opened:
  // a mouse is already over the row it highlights, and scrolling for every hover would only add work.
  const scrollToHighlight = useRef(false);
  const justOpened = useRef(false);
  useEffect(() => {
    const el = list.current;
    if (!open || !el || !scrollToHighlight.current) return;
    scrollToHighlight.current = false;
    if (!windowed) {
      el.querySelector<HTMLElement>(`[data-index="${highlight}"]`)?.scrollIntoView({ block: "nearest" });
      return;
    }
    // Rows that are not drawn can't be scrolled to, so the position is worked out from the row's place instead.
    const rowTop = LIST_PADDING + highlight * ROW_HEIGHT;
    const view = el.clientHeight;
    if (justOpened.current) el.scrollTop = Math.max(0, rowTop - view / 2 + ROW_HEIGHT / 2);
    else if (rowTop < el.scrollTop) el.scrollTop = rowTop - LIST_PADDING;
    else if (rowTop + ROW_HEIGHT > el.scrollTop + view) el.scrollTop = rowTop + ROW_HEIGHT - view + LIST_PADDING;
    justOpened.current = false;
  }, [open, highlight, windowed]);

  const choose = (index: number) => {
    setOpen(false);
    const next = options[index];
    if (!next) return;
    if (value === undefined) setInner(next.value);
    if (next.value !== current) onChange?.(next.value);
  };
  // The rows get functions that never change, so a row is only redrawn when it is the one gaining or losing the highlight.
  const latestChoose = useRef(choose);
  useEffect(() => {
    latestChoose.current = choose;
  });
  const onChoose = useCallback((index: number) => latestChoose.current(index), []);
  const onHover = useCallback((index: number) => setHighlight(index), []);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Escape" || e.key === "Tab") return setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      scrollToHighlight.current = true;
      if (!open) {
        justOpened.current = true;
        setHighlight(selected);
        setTop(Math.max(0, selected - 3));
        return setOpen(true);
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      return setHighlight((h) => (h + step + options.length) % options.length);
    }
    if (e.key === "Home" || e.key === "End") {
      if (!open) return;
      e.preventDefault();
      scrollToHighlight.current = true;
      return setHighlight(e.key === "Home" ? 0 : options.length - 1);
    }
    if (e.key === "Enter" || e.key === " ") {
      // Enter must not submit the surrounding form while the list is the thing being operated.
      e.preventDefault();
      if (open) choose(highlight);
      else {
        scrollToHighlight.current = true;
        justOpened.current = true;
        setHighlight(selected);
        setTop(Math.max(0, selected - 3));
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
          scrollToHighlight.current = true;
          justOpened.current = true;
          setHighlight(selected);
          setTop(Math.max(0, selected - 3));
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
          onScroll={(e) => {
            if (windowed) setTop(Math.max(0, Math.floor((e.currentTarget.scrollTop - LIST_PADDING) / ROW_HEIGHT)));
          }}
          className={`absolute z-20 ${listMaxHeightClass} ${windowed ? "w-full" : "min-w-full"} overflow-auto rounded-xl bg-surface p-1.5 text-sm shadow-lg ring-1 ring-black/[0.08] ${openUp ? "bottom-full mb-2" : "top-full mt-2"} ${align === "right" ? "right-0" : "left-0"}`}
        >
          {windowed && first > 0 && <li role="presentation" aria-hidden style={{ height: first * ROW_HEIGHT }} />}
          {options.slice(first, last).map((o, k) => {
            const i = first + k;
            return <Row key={o.value} option={o} index={i} id={`${uid}-${i}`} highlighted={i === highlight} selected={i === selected} onHover={onHover} onChoose={onChoose} />;
          })}
          {windowed && last < options.length && <li role="presentation" aria-hidden style={{ height: (options.length - last) * ROW_HEIGHT }} />}
        </ul>
      )}
    </div>
  );
}
