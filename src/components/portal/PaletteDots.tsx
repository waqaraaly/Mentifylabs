import { Check } from "lucide-react";

export interface PaletteDot {
  id: string;
  name: string;
  /** Page, tint and accent, in that order. */
  colors: [string, string, string];
}

/**
 * A row of round swatches for choosing a palette, with the chosen one's name above. Each dot shows the palette's page,
 * tint and accent as three bands; the name is also its tooltip and accessible label.
 */
export function PaletteDots({
  label,
  items,
  selected,
  onSelect,
  emptyLabel = "",
}: {
  label: string;
  items: PaletteDot[];
  selected?: string;
  onSelect: (id: string) => void;
  emptyLabel?: string;
}) {
  const current = items.find((i) => i.id === selected);
  return (
    <div>
      <p className="mb-3 text-sm font-medium">{current?.name ?? emptyLabel}</p>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-2.5"
      >
        {items.map((item) => {
          const on = item.id === selected;
          const [bg, tint, accent] = item.colors;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={item.name}
              title={item.name}
              onClick={() => onSelect(item.id)}
              className={`flex size-10 cursor-pointer items-center justify-center rounded-full transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                on
                  ? "ring-2 ring-primary ring-offset-2"
                  : "ring-1 ring-black/[0.15]"
              }`}
              style={{
                background: `linear-gradient(135deg, ${bg} 0 38%, ${tint} 38% 62%, ${accent} 62% 100%)`,
              }}
            >
              <Check
                className={`size-4 text-white mix-blend-difference ${on ? "opacity-100" : "opacity-0"}`}
                strokeWidth={3}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
