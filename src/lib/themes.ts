export type ColorThemeId = "sage" | "ink-blue" | "golden-hour" | "juniper-brick" | "ocean-mist" | "fog-teal" | "olive-grove" | "clinic-blue" | "eucalyptus" | "lagoon" | "lavender-mist" | "moss-honey" | "cobalt" | "blue-sand" | "deep-violet" | "navy-ice" | "night-sky" | "clinical-teal" | "evergreen" | "forest-green";

export type ColorThemeGroup = "Greens" | "Blues" | "Teals" | "Violet and yellow";

export interface ColorThemeOption {
  id: ColorThemeId;
  /** Which family the picker files it under, so twenty options read as four short rows. */
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
    description: "Oat cream and oat frame with moss green on buttons and the contact card. The default.",
    swatches: ["#f6f4ea", "#ebe8d8", "#66794f", "#f6e8c8"],
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
    group: "Violet and yellow",
    name: "Yellow",
    description: "White with a golden-yellow accent.",
    swatches: ["#FFFFFF", "#FFCC1C", "#FFD74D", "#DDEEF6"],
  },
  {
    id: "juniper-brick",
    group: "Greens",
    name: "Green and brick red",
    description: "Warm paper with deep green and brick-red accents.",
    swatches: ["#FAF8F3", "#E9DED3", "#2E4F44", "#B0432F"],
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
    id: "lagoon",
    group: "Teals",
    name: "Lagoon",
    description: "Light aqua with a deep lagoon-teal accent.",
    swatches: ["#f7fbfb", "#d3ebec", "#1b7478", "#e7f4f5"],
  },
  {
    id: "lavender-mist",
    group: "Violet and yellow",
    name: "Lavender mist",
    description: "Soft lilac with a muted violet accent.",
    swatches: ["#fafafc", "#e5e0f3", "#6558a0", "#f1eef8"],
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
    id: "deep-violet",
    group: "Violet and yellow",
    name: "Deep violet",
    description: "Pale violet-white with a deep purple accent.",
    swatches: ["#fbfafd", "#d9f2fa", "#351F65", "#eaf8fc"],
  },
  {
    id: "navy-ice",
    group: "Blues",
    name: "Navy and ice",
    description: "Cool white with a deep navy accent and an ice-blue frame.",
    swatches: ["#fafcff", "#dce9fd", "#00234B", "#ecf3fe"],
  },
  {
    id: "night-sky",
    group: "Blues",
    name: "Night sky",
    description: "Soft periwinkle white with a night-sky navy card.",
    swatches: ["#fafbfe", "#dfe6fa", "#5672c9", "#edf1fc"],
  },
  {
    id: "clinical-teal",
    group: "Teals",
    name: "Clinical teal",
    description: "Cool white with a clinical teal accent and navy card.",
    swatches: ["#fafcfd", "#e0eef0", "#017A8F", "#eef6f7"],
  },
  {
    id: "evergreen",
    group: "Greens",
    name: "Evergreen",
    description: "Warm white with a very deep green accent.",
    swatches: ["#fcfbf9", "#e4f2f0", "#01382E", "#f0f8f7"],
  },
  {
    id: "forest-green",
    group: "Greens",
    name: "Forest green",
    description: "Pale green-white with a mid forest-green accent.",
    swatches: ["#fafdfa", "#dff0dc", "#397A4A", "#edf7ec"],
  },
];

/** The families in the order the picker shows them. */
export const COLOR_THEME_GROUPS: ColorThemeGroup[] = ["Greens", "Blues", "Teals", "Violet and yellow"];

export const DEFAULT_COLOR_THEME: ColorThemeId = "moss-honey";

export function isColorThemeId(value: string | undefined | null): value is ColorThemeId {
  return COLOR_THEMES.some((theme) => theme.id === value);
}
