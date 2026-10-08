export type ColorThemeId = "sage" | "ink-blue" | "golden-hour" | "ocean-mist" | "fog-teal" | "olive-grove" | "clinic-blue" | "eucalyptus" | "moss-honey" | "cobalt" | "blue-sand" | "night-sky";

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
    swatches: ["#f6f4ea", "#66794f", "#66794f", "#f6e8c8"],
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
    id: "olive-grove",
    group: "Greens",
    name: "Olive",
    description: "Warm white with a muted deep olive accent.",
    swatches: ["#F8F8F6", "#DEE3D3", "#56603E", "#ECEDE8"],
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
    description: "Pale grey-green with a deep eucalyptus accent.",
    swatches: ["#f8faf9", "#d8eae1", "#37755f", "#eaf3ee"],
  },
  {
    id: "cobalt",
    group: "Blues",
    name: "Cobalt",
    description: "White with a clear cobalt-blue accent.",
    swatches: ["#fafcfe", "#d6e9f6", "#0372BC", "#e8f3fa"],
  },
  {
    id: "blue-sand",
    group: "Blues",
    name: "Blue and sand",
    description: "Warm sand with a bright blue accent.",
    swatches: ["#fbfaf8", "#efe7db", "#2A72DE", "#f6f2eb"],
  },
  {
    id: "night-sky",
    group: "Blues",
    name: "Night sky",
    description: "Soft periwinkle white with a night-sky navy card.",
    swatches: ["#fafbfe", "#dfe6fa", "#5672c9", "#edf1fc"],
  },
];

/** The families in the order the picker shows them. */
export const COLOR_THEME_GROUPS: ColorThemeGroup[] = ["Greens", "Blues", "Teals", "Yellow"];

export const DEFAULT_COLOR_THEME: ColorThemeId = "moss-honey";

export function isColorThemeId(value: string | undefined | null): value is ColorThemeId {
  return COLOR_THEMES.some((theme) => theme.id === value);
}
