import type { ReactNode } from "react";
import { Check, Pipette } from "lucide-react";

export interface PaletteDot {
  id: string;
  name: string;
  /** Page, tint, accent and text, in that order. */
  colors: [string, string, string, string];
}

/**
 * One choice: a flat preview of a palette (a panel holding a heading bar and a button, in the palette's colours) with
 * its name underneath. The chosen card shows a tick.
 */
function PaletteCard({
  name,
  colors,
  on,
  onClick,
  hint,
}: {
  name: string;
  colors: [string, string, string, string];
  on: boolean;
  onClick: () => void;
  /** Shown under the name. */
  hint?: string;
}) {
  const [bg, tint, accent, ink] = colors;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`block w-full cursor-pointer rounded-xl border bg-surface p-1.5 text-left transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
        on
          ? "border-primary ring-1 ring-primary"
          : "border-border hover:border-foreground/30"
      }`}
    >
      <span
        aria-hidden
        className="relative flex aspect-[16/9] items-center justify-center rounded-lg ring-1 ring-black/[0.06]"
        style={{ background: bg }}
      >
        <span
          className="flex w-3/5 flex-col gap-2 rounded-md p-2.5"
          style={{ background: tint }}
        >
          <span
            className="block h-1.5 w-3/4 rounded-full"
            style={{ background: ink }}
          />
          <span
            className="block h-3 w-1/2 rounded-full"
            style={{ background: accent }}
          />
        </span>
        {on && (
          <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Check className="size-3" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="block px-1.5 py-2">
        <span className="block truncate text-sm font-medium">{name}</span>
        {hint && (
          <span className="block truncate text-xs text-muted">{hint}</span>
        )}
      </span>
    </button>
  );
}

/**
 * The ready-made schemes, of which at most one is chosen. Choosing one is what puts it on the page.
 */
export function PaletteDots({
  label,
  items,
  selected,
  onSelect,
  leading,
}: {
  label: string;
  items: PaletteDot[];
  /** The chosen scheme; nothing when the page is using the person's own colours instead. */
  selected?: string;
  onSelect: (id: string) => void;
  /** A card shown before the schemes, such as the person's own colours. */
  leading?: ReactNode;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid grid-cols-2 gap-4 sm:grid-cols-3"
    >
      {leading}
      {items.map((item) => (
        <PaletteCard
          key={item.id}
          name={item.name}
          colors={item.colors}
          on={item.id === selected}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </div>
  );
}

/**
 * The card for "I will set my own". Plain hatching with a pipette until they have chosen any colour, then a preview in
 * the colours they have chosen.
 */
export function CustomPaletteCard({
  colors,
  on,
  onClick,
}: {
  /** Page, tint, accent and text as they stand; null while no colour has been chosen yet. */
  colors: [string, string, string, string] | null;
  on: boolean;
  onClick: () => void;
}) {
  const [bg, tint, accent, ink] = colors ?? ["", "", "", ""];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={`block w-full cursor-pointer rounded-xl border bg-surface p-1.5 text-left transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
        on
          ? "border-primary ring-1 ring-primary"
          : "border-border hover:border-foreground/30"
      }`}
    >
      <span
        aria-hidden
        className="relative flex aspect-[16/9] items-center justify-center rounded-lg ring-1 ring-black/[0.06]"
        style={
          colors
            ? { background: bg }
            : {
                background:
                  "repeating-linear-gradient(45deg, rgb(0 0 0 / 0.04) 0 7px, transparent 7px 14px)",
              }
        }
      >
        {colors ? (
          <span
            className="flex w-3/5 flex-col gap-2 rounded-md p-2.5"
            style={{ background: tint }}
          >
            <span
              className="block h-1.5 w-3/4 rounded-full"
              style={{ background: ink }}
            />
            <span
              className="block h-3 w-1/2 rounded-full"
              style={{ background: accent }}
            />
          </span>
        ) : (
          <Pipette className="size-6 text-muted" />
        )}
        {on && (
          <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Check className="size-3" strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="block px-1.5 py-2">
        <span className="block truncate text-sm font-medium">
          Your own colours
        </span>
        <span className="block truncate text-xs text-muted">
          Set with codes or names
        </span>
      </span>
    </button>
  );
}
