"use client";

import { Check } from "lucide-react";

export interface ColorOption {
  name: string;
  hex: string;
}

const same = (a?: string, b?: string) =>
  (a ?? "").toLowerCase() === (b ?? "").toLowerCase();

/**
 * One part of the page and the colour it takes: the scheme's own colour first, then a few suggestions, then any colour
 * from the picker. Nothing chosen means the scheme's colour is used.
 */
export function ColorRow({
  label,
  hint,
  options,
  schemeColor,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  options: ColorOption[];
  /** What this part is in the scheme, shown as the first choice. */
  schemeColor: string;
  value: string | undefined;
  onChange: (hex: string | undefined) => void;
}) {
  const custom = value && !options.some((o) => same(o.hex, value));

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-baseline gap-x-3">
        <h4 className="text-sm font-semibold">{label}</h4>
        <p className="text-sm text-muted">{hint}</p>
      </div>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap items-center gap-2.5"
      >
        <Dot
          name="Scheme colour"
          hex={schemeColor}
          on={!value}
          onClick={() => onChange(undefined)}
        />
        {options.map((o) => (
          <Dot
            key={o.hex}
            name={o.name}
            hex={o.hex}
            on={same(value, o.hex)}
            onClick={() => onChange(o.hex)}
          />
        ))}
        <label
          className={`relative flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full transition hover:scale-105 ${custom ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-black/[0.15]"}`}
          title="Choose any colour"
        >
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background: custom
                ? value
                : "conic-gradient(#e0554a, #e9b13a, #7cb35a, #3d9bb5, #6a62c4, #d65a9a, #e0554a)",
            }}
          />
          <span
            aria-hidden
            className="relative size-3.5 rounded-full bg-white ring-1 ring-black/20"
          />
          <input
            type="color"
            aria-label={`Choose any colour for ${label.toLowerCase()}`}
            value={value ?? schemeColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}

function Dot({
  name,
  hex,
  on,
  onClick,
}: {
  name: string;
  hex: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={name}
      title={name}
      onClick={onClick}
      className={`flex size-9 cursor-pointer items-center justify-center rounded-full transition hover:scale-105 ${on ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-black/[0.15]"}`}
      style={{ background: hex }}
    >
      <Check
        className={`size-4 text-white mix-blend-difference ${on ? "opacity-100" : "opacity-0"}`}
        strokeWidth={3}
        aria-hidden
      />
    </button>
  );
}
