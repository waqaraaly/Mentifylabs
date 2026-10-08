"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { COLOR_THEMES, COLOR_THEME_GROUPS, type ColorThemeId } from "@/lib/themes";

/**
 * The colour themes, shown as small swatches in a few families instead of large cards. A live preview above
 * them is drawn with the chosen theme's own colours, so what is shown is what the public page will use. Each swatch is
 * a native radio input, so the choice still submits with the rest of the profile form through `name="colorTheme"`.
 */
export function ThemePicker({ selected }: { selected: ColorThemeId }) {
  const [current, setCurrent] = useState<ColorThemeId>(selected);
  const theme = COLOR_THEMES.find((t) => t.id === current) ?? COLOR_THEMES[0];

  return (
    <div className="space-y-5">
      {/* The preview carries the theme attribute, so it picks up the same variables the public profile does. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl bg-black/[0.025] p-4 ring-1 ring-black/[0.05]">
        <div data-pt-theme={current} className="w-full max-w-[260px] shrink-0 rounded-xl bg-(--pt-outer) p-1.5" aria-hidden>
          <div className="rounded-lg bg-(--pt-bg) p-3 text-(--pt-text)">
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-[0.02em]">MentifyLabs</span>
              <span className="rounded-full bg-(--pt-accent) px-2.5 py-1 text-[9px] font-semibold text-(--pt-accent-foreground)">Book a Session</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="size-11 shrink-0 rounded-[55%_45%_50%_50%/50%_55%_45%_50%] border-[3px] border-(--pt-outer) bg-white" />
              <div className="min-w-0">
                <p className="text-sm leading-tight font-bold">Dr. Name</p>
                <p className="mt-0.5 text-[10px] text-(--pt-muted)">Psychologist</p>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              <span className="rounded bg-(--pt-tile-1) px-2 py-1 text-[9px] font-medium text-(--pt-tile-fg,var(--pt-accent-foreground))">Anxiety</span>
              <span className="rounded bg-(--pt-tile-1) px-2 py-1 text-[9px] font-medium text-(--pt-tile-fg,var(--pt-accent-foreground))">Stress</span>
              <span className="ml-auto h-5 w-12 rounded bg-(--pt-dark-card) ring-1 ring-(--pt-dark-card-border)" />
            </div>
          </div>
        </div>
        <div className="min-w-[180px] flex-1">
          <p className="text-sm font-semibold">{theme.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{theme.description}</p>
        </div>
      </div>

      <div role="radiogroup" aria-label="Color theme" className="space-y-4">
        {COLOR_THEME_GROUPS.map((group) => (
          <div key={group} className="grid items-center gap-x-4 gap-y-2 sm:grid-cols-[120px_1fr]">
            <p className="text-xs font-medium tracking-[0.04em] text-muted">{group}</p>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_THEMES.filter((t) => t.group === group).map((t) => (
                <label key={t.id} title={t.name} className="group relative cursor-pointer">
                  <input
                    type="radio"
                    name="colorTheme"
                    value={t.id}
                    checked={current === t.id}
                    onChange={() => setCurrent(t.id)}
                    className="peer sr-only"
                  />
                  <span className="sr-only">{t.name}</span>
                  {/* The frame colour as a rounded square, with the accent as a circle inside it. */}
                  <span
                    aria-hidden
                    className="flex size-11 items-center justify-center rounded-xl ring-1 ring-black/[0.1] transition peer-checked:ring-2 peer-checked:ring-primary peer-checked:ring-offset-2 peer-focus-visible:ring-2 peer-focus-visible:ring-primary group-hover:scale-105"
                    style={{ background: t.swatches[1] }}
                  >
                    <span className="flex size-6 items-center justify-center rounded-full shadow-sm" style={{ background: t.swatches[2] }}>
                      <Check className={`size-3.5 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.7)] ${current === t.id ? "opacity-100" : "opacity-0"}`} strokeWidth={3} />
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
