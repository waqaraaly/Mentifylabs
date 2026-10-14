export type ColorThemeId = "sage" | "ink-blue" | "golden-hour" | "ocean-mist" | "fog-teal" | "teal-tints" | "olive-grove" | "clinic-blue" | "eucalyptus" | "moss-honey" | "blue-sand" | "sage-clay" | "soft-sky";

export type ColorThemeGroup = "Greens" | "Blues" | "Teals" | "Yellow";

export interface ColorThemeOption {
  id: ColorThemeId;
  /** Which family the picker files it under, so the options read as a few short rows. */
  group: ColorThemeGroup;
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
    id: "moss-honey",
    group: "Greens",
    name: "Moss and honey",
    description: "Oat cream page in a moss green frame, with moss green on buttons and the contact card. The default.",
    swatches: ["#f6f4ea", "#7f9166", "#66794f", "#f6e8c8"],
  },
  {
    id: "sage",
    group: "Greens",
    name: "Sage green",
    description: "Warm cream with a sage-green accent.",
    swatches: ["#F7F5EE", "#BFE0B8", "#607568", "#EDE8DE"],
  },
  {
    id: "ink-blue",
    group: "Blues",
    name: "Navy blue",
    description: "White with a deep navy accent.",
    swatches: ["#FFFFFF", "#CBDCE8", "#2F4C6B", "#E7E4DC"],
  },
  {
    id: "golden-hour",
    group: "Yellow",
    name: "Yellow",
    description: "White with a golden-yellow accent.",
    swatches: ["#FFFFFF", "#FFCC1C", "#FFD74D", "#DDEEF6"],
  },
  {
    id: "ocean-mist",
    group: "Teals",
    name: "Bright teal",
    description: "White with a pale aqua frame and a teal accent.",
    swatches: ["#F8FCFD", "#CFE8EE", "#1E7A8C", "#E2F1F4"],
  },
  {
    id: "fog-teal",
    group: "Teals",
    name: "Soft teal",
    description: "Grey-white with a muted deep teal accent.",
    swatches: ["#F6F8F8", "#D3E2E3", "#3E5E60", "#E8EDED"],
  },
  {
    id: "teal-tints",
    group: "Teals",
    name: "Pale teal tints",
    description: "White page in a pale teal frame, with deeper teal boxes and contact card.",
    swatches: ["#ffffff", "#e0f0f2", "#3B7C8A", "#4A9DA8"],
  },
  {
    id: "olive-grove",
    group: "Greens",
    name: "Greige and olive",
    description: "Warm greige frame and cream page with a deep olive accent.",
    swatches: ["#f8f5ef", "#d6cfc2", "#55603a", "#ebe6da"],
  },
  {
    id: "clinic-blue",
    group: "Blues",
    name: "Clinic blue",
    description: "Cool white with a calm clinical blue.",
    swatches: ["#f9fbfc", "#dcebf4", "#2c6a8f", "#ecf4f9"],
  },
  {
    id: "eucalyptus",
    group: "Greens",
    name: "Eucalyptus",
    description: "Pale grey-green in a sage green frame, with a deep green contact card and soft sage boxes.",
    swatches: ["#f8faf9", "#7a9471", "#37755f", "#dde8d3"],
  },
  {
    id: "blue-sand",
    group: "Blues",
    name: "Denim and oat",
    description: "Warm oat page in a denim blue frame, with oat cards and a denim accent.",
    swatches: ["#faf6ed", "#3f6aa8", "#3f6aa8", "#efe7d6"],
  },
  {
    id: "sage-clay",
    group: "Greens",
    name: "Sage and clay",
    description: "Pale sage frame and sage button, with clay-tint boxes and a sage contact card.",
    swatches: ["#f7f5f0", "#eef0e8", "#7a9471", "#f2e7da"],
  },
  {
    id: "soft-sky",
    group: "Blues",
    name: "Soft sky",
    description: "A soft sky-blue frame, a sky-blue button, and a deep blue contact card and boxes.",
    swatches: ["#f9fcfe", "#8fb8d6", "#7fb1d4", "#2e6487"],
  },
];

/** The families in the order the picker shows them. */
export const COLOR_THEME_GROUPS: ColorThemeGroup[] = ["Greens", "Blues", "Teals", "Yellow"];

export const DEFAULT_COLOR_THEME: ColorThemeId = "moss-honey";

export function isColorThemeId(value: string | undefined | null): value is ColorThemeId {
  return COLOR_THEMES.some((theme) => theme.id === value);
}
