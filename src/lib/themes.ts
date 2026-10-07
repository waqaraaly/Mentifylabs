export type ColorThemeId = "sage" | "ink-blue" | "golden-hour" | "juniper-brick" | "ocean-mist" | "fog-teal" | "olive-grove";

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
    name: "Sage green",
    description: "Warm cream with a sage-green accent. The default.",
    swatches: ["#F7F5EE", "#BFE0B8", "#607568", "#EDE8DE"],
  },
  {
    id: "ink-blue",
    name: "Navy blue",
    description: "White with a deep navy accent.",
    swatches: ["#FFFFFF", "#CBDCE8", "#2F4C6B", "#E7E4DC"],
  },
  {
    id: "golden-hour",
    name: "Yellow",
    description: "White with a golden-yellow accent.",
    swatches: ["#FFFFFF", "#FFCC1C", "#FFD74D", "#DDEEF6"],
  },
  {
    id: "juniper-brick",
    name: "Green and brick red",
    description: "Warm paper with deep green and brick-red accents.",
    swatches: ["#FAF8F3", "#E9DED3", "#2E4F44", "#B0432F"],
  },
  {
    id: "ocean-mist",
    name: "Bright teal",
    description: "White with a pale aqua frame and a teal accent.",
    swatches: ["#F8FCFD", "#CFE8EE", "#1E7A8C", "#E2F1F4"],
  },
  {
    id: "fog-teal",
    name: "Soft teal",
    description: "Grey-white with a muted deep teal accent.",
    swatches: ["#F6F8F8", "#D3E2E3", "#3E5E60", "#E8EDED"],
  },
  {
    id: "olive-grove",
    name: "Olive",
    description: "Warm white with a muted deep olive accent.",
    swatches: ["#F8F8F6", "#DEE3D3", "#56603E", "#ECEDE8"],
  },
];

export const DEFAULT_COLOR_THEME: ColorThemeId = "sage";

export function isColorThemeId(value: string | undefined | null): value is ColorThemeId {
  return COLOR_THEMES.some((theme) => theme.id === value);
}
