"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

/** "#abc", "abc", "#aabbcc" or "AABBCC" as "#aabbcc"; anything else is not a hex code. */
function parseHex(text: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text.trim());
  if (!m) return null;
  const h = m[1].toLowerCase();
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return `#${full}`;
}

/**
 * A hex code, or a CSS colour name such as "teal" or "rebeccapurple", as "#rrggbb". The browser does the naming: a
 * canvas keeps its previous colour when it is given something it cannot read, so a text that gives the same result
 * against two different starting colours is a real, opaque colour.
 */
function parseColor(text: string): string | null {
  const hex = parseHex(text);
  if (hex) return hex;
  const name = text.trim().toLowerCase();
  if (!/^[a-z]{3,30}$/.test(name) || typeof document === "undefined")
    return null;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#000000";
  ctx.fillStyle = name;
  const first = ctx.fillStyle;
  ctx.fillStyle = "#ffffff";
  ctx.fillStyle = name;
  return first === ctx.fillStyle && first.startsWith("#") ? first : null;
}

/**
 * One part of the page and its colour, on a single line: a swatch that opens the colour picker, the part's name, and a
 * field for any colour code or colour name. Until a colour is entered the part keeps the starting colour.
 */
export function ColorRow({
  label,
  hint,
  startColor,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  /** The colour this part has until the person sets one. */
  startColor: string;
  value: string | undefined;
  onChange: (hex: string | undefined) => void;
}) {
  /** What is being typed, while it is being typed; null shows the colour in use. */
  const [draft, setDraft] = useState<string | null>(null);

  const current = value ?? startColor;
  const invalid = draft !== null && draft.trim() !== "" && !parseColor(draft);

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <label
          className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-black/10 transition focus-within:ring-2 focus-within:ring-primary hover:ring-black/30"
          title="Pick a colour"
        >
          <span
            aria-hidden
            className="absolute inset-0"
            style={{ background: current }}
          />
          <input
            type="color"
            aria-label={`Pick a colour for ${label.toLowerCase()}`}
            value={current}
            onChange={(e) => {
              setDraft(null);
              onChange(e.target.value);
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>

        <div className="min-w-44 flex-1">
          <span className="block text-sm font-medium">{label}</span>
          <span className="block text-[13px] leading-snug text-muted">
            {hint}
          </span>
        </div>

        <input
          type="text"
          spellCheck={false}
          autoComplete="off"
          maxLength={30}
          aria-label={`Colour code or name for ${label.toLowerCase()}`}
          aria-invalid={invalid}
          placeholder="#1F6F5C or teal"
          value={draft ?? current.toUpperCase()}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            setDraft(e.target.value);
            const hex = parseColor(e.target.value);
            if (hex) onChange(hex);
          }}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            // This sits inside the profile form; Enter confirms the colour and must not save the page.
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className={`h-10 w-36 shrink-0 rounded-lg border bg-background px-3 font-mono text-sm focus-visible:ring-2 focus-visible:outline-none ${invalid ? "border-red-500 focus-visible:ring-red-500" : "border-border focus-visible:ring-primary"}`}
        />

        <button
          type="button"
          disabled={!value}
          aria-label={`Reset ${label.toLowerCase()} to its starting colour`}
          onClick={() => {
            setDraft(null);
            onChange(undefined);
          }}
          className="flex h-10 w-14 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg text-sm text-muted transition hover:text-foreground disabled:pointer-events-none disabled:opacity-0"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reset
        </button>
      </div>

      {invalid && (
        <p className="mt-2 pl-14 text-xs text-red-600" role="alert">
          Enter a colour code like #1F6F5C, or a colour name like teal.
        </p>
      )}
    </div>
  );
}
