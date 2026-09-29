export type ColorThemeId = "sage" | "ink-blue" | "golden-hour" | "juniper-brick" | "ocean-mist";

export interface ColorThemeOption {
  id: ColorThemeId;
  name: string;
  description: string;
  /** A handful of swatches for the picker preview, roughly in visual order. */
  swatches: string[];
}

// Actual color values live in globals.css as CSS custom properties, scoped
// per theme under [data-pt-theme="…"] — this list is only for the dashboard
// picker's preview UI and for validating a submitted theme id.
export const COLOR_THEMES: ColorThemeOption[] = [
  {
    id: "sage",
    name: "Sage Meadow",
    description: "The original palette — warm cream surfaces with a sage-green accent.",
    swatches: ["#F7F5EE", "#BFE0B8", "#607568", "#EDE8DE"],
  },
  {
    id: "ink-blue",
    name: "Harbor Blue",
    description: "A crisp white surface with a deep ink-blue accent.",
    swatches: ["#FFFFFF", "#CBDCE8", "#2F4C6B", "#E7E4DC"],
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    description: "A bright white surface with a warm golden-yellow accent.",
    swatches: ["#FFFFFF", "#FFCC1C", "#FFD74D", "#DDEEF6"],
  },
  {
    id: "juniper-brick",
    name: "Juniper & Brick",
    description: "A warm paper surface with deep juniper green and brick-red accents.",
    swatches: ["#FAF8F3", "#E9DED3", "#2E4F44", "#B0432F"],
  },
  {
    id: "ocean-mist",
    name: "Ocean Mist",
    description: "A crisp white surface with a pale aqua frame and a deep ocean-teal accent.",
    swatches: ["#F8FCFD", "#CFE8EE", "#1E7A8C", "#E2F1F4"],
  },
];

export const DEFAULT_COLOR_THEME: ColorThemeId = "sage";

export function isColorThemeId(value: string | undefined | null): value is ColorThemeId {
  return COLOR_THEMES.some((theme) => theme.id === value);
}
