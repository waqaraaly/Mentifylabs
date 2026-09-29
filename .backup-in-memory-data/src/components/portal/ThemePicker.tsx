import { Check } from "lucide-react";
import { COLOR_THEMES, type ColorThemeId } from "@/lib/themes";

/**
 * A grid of radio-selectable swatch cards. Pure native `<input type="radio">`
 * plus Tailwind's `has-[:checked]` variant drives the selected look, so this
 * needs no client JS — it submits through the same profile form as every
 * other field, via the shared `name="colorTheme"`.
 */
export function ThemePicker({ selected }: { selected: ColorThemeId }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {COLOR_THEMES.map((theme) => (
        <label
          key={theme.id}
          className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl p-4 ring-1 ring-black/[0.06] transition has-[:checked]:ring-2 has-[:checked]:ring-primary"
        >
          <input
            type="radio"
            name="colorTheme"
            value={theme.id}
            defaultChecked={selected === theme.id}
            className="sr-only"
          />

          <div className="flex items-center justify-between">
            <span className="flex overflow-hidden rounded-lg ring-1 ring-black/[0.06]">
              {theme.swatches.map((swatch) => (
                <span key={swatch} className="size-6" style={{ background: swatch }} />
              ))}
            </span>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 transition group-has-[:checked]:opacity-100">
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </span>
          </div>

          <div>
            <p className="text-sm font-semibold">{theme.name}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{theme.description}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
