import { HEX, contrast, darken, isDark, mix, readableOn } from "@/lib/color";
import { COLOR_THEMES, type ColorThemeId } from "@/lib/themes";

/**
 * Profile design, as four independent choices (see docs/profile-template-audit.md for why these shapes):
 *
 *   layout  how the page is organised. Structure only: no colour, no type.
 *   scheme  the colours: page, cards, text and accent. Works with every layout.
 *   font    the typeface pairing. Works with every layout.
 *   shape   the crop of the photo.
 *
 * plus an optional custom accent colour and a list of sections switched off. A practitioner's choices are stored as the
 * layout id (the `template` column) and a ProfileStyle (the `style` column) with all the rest, so changing one never
 * changes another. Older saves that named a whole template are converted by normalizeSelection.
 */

/**
 * rail: identity header, content, and a sticky booking card. tabs: the same with a sticky tab bar. clinic: a
 * practice-website page. directory: a compact card page for phones. narrative: a calm, readable story page.
 * card: one narrow column of big buttons. panel: identity fixed on one side, content scrolling on the other.
 * folio: a quiet personal page: plain identity fixed on the left, labelled sections and hairline cards on the right.
 * linkpage: the same page in its plainest form: photo, name, title and links on the left, one card per thing on the right.
 */
export type LayoutKind = "rail" | "linkpage";
export type PhotoShape = "circle" | "rounded" | "oval" | "square" | "blob";
export type ExpertiseStyle = "chips" | "bullets" | "checks" | "tiles" | "cloud";
export type ServicesStyle = "bullets" | "checks" | "cards" | "rows";
export type JourneyStyle = "rail" | "rows" | "cards";

// ---- Colour schemes ----

export interface Palette {
  /** The page. */
  bg: string;
  /** Cards and panels that sit on the page. */
  surface: string;
  ink: string;
  accent: string;
  /** A soft tint of the brand: header bands, side panels, hover and highlight areas. */
  alt: string;
  dark?: boolean;
}

export type SchemeId =
  | "moss-honey"
  | "sky-green"
  | "sand-petrol"
  | "sage"
  | "navy-mint"
  | "teal-white"
  | "lavender-indigo"
  | "cream-olive"
  | "clinic-blue"
  | "leaf-green"
  | "stone-slate"
  | "grey-navy"
  | "mint-green"
  | "sand-clay"
  | "white-plum"
  | "paper-walnut"
  | "golden-hour"
  | "denim-oat"
  | "sky-blue"
  | "soft-teal"
  | "forest-mint"
  | "deep-teal"
  | "stone-terracotta"
  | "stone-forest";

export interface Scheme {
  id: SchemeId;
  name: string;
  palette: Palette;
  /** No longer offered in the picker. Kept so profiles and older presets that use it look the same. */
  retired?: boolean;
  /** One of the original colour themes. Layout 1 shows it in that theme's own hand-made styling, not rebuilt from the palette. */
  originalTheme?: ColorThemeId;
}

/** Calm, health-appropriate colours: teal, blue, green, sage, plum, warm neutrals, and two dark options. */
export const SCHEMES: Scheme[] = [
  {
    id: "moss-honey",
    name: "Moss and honey",
    originalTheme: "moss-honey",
    palette: {
      bg: "#F6F4EA",
      surface: "#FFFFFF",
      ink: "#2E3522",
      accent: "#66794F",
      alt: "#F6E8C8",
    },
  },
  {
    id: "teal-white",
    name: "Teal on white",
    palette: {
      bg: "#FFFFFF",
      surface: "#FFFFFF",
      ink: "#14303A",
      accent: "#00808A",
      alt: "#E3F3F4",
    },
  },
  {
    id: "clinic-blue",
    name: "Clinic blue",
    palette: {
      bg: "#FFFFFF",
      surface: "#F3F7FC",
      ink: "#14263F",
      accent: "#2563A8",
      alt: "#E6EEF8",
    },
  },
  {
    id: "sky-green",
    retired: true,
    name: "Sky and green",
    palette: {
      bg: "#EAF2FA",
      surface: "#FFFFFF",
      ink: "#16283A",
      accent: "#0F6B52",
      alt: "#D5E6F5",
    },
  },
  {
    id: "sky-blue",
    name: "Pale sky and blue",
    palette: {
      bg: "#F1F7FC",
      surface: "#FFFFFF",
      ink: "#1B2C3C",
      accent: "#2C6E9B",
      alt: "#D9EAF6",
    },
  },
  {
    id: "grey-navy",
    retired: true,
    name: "Cool grey and navy",
    palette: {
      bg: "#EEF2F7",
      surface: "#FFFFFF",
      ink: "#12263D",
      accent: "#0F4C81",
      alt: "#DCE7F3",
    },
  },
  {
    id: "soft-teal",
    name: "Soft teal",
    palette: {
      bg: "#DDEFF0",
      surface: "#FFFFFF",
      ink: "#123238",
      accent: "#0E7C86",
      alt: "#BFE1E3",
    },
  },
  {
    id: "deep-teal",
    name: "Deep teal",
    palette: {
      bg: "#FFFFFF",
      surface: "#F2F7F7",
      ink: "#17323A",
      accent: "#0F5964",
      alt: "#E1EEEF",
    },
  },
  {
    id: "sand-petrol",
    name: "Sand and petrol",
    palette: {
      bg: "#FFFFFF",
      surface: "#FFFFFF",
      ink: "#17262E",
      accent: "#0B6E84",
      alt: "#EEE8DB",
    },
  },
  {
    id: "sage",
    name: "Sage on white",
    palette: {
      bg: "#FBFCFA",
      surface: "#FFFFFF",
      ink: "#1F2D26",
      accent: "#4A7A5C",
      alt: "#E8F0EA",
    },
  },
  {
    id: "leaf-green",
    name: "Leaf green",
    palette: {
      bg: "#F3F8F3",
      surface: "#FFFFFF",
      ink: "#1E3328",
      accent: "#2F7D5B",
      alt: "#DCEBDD",
    },
  },
  {
    id: "mint-green",
    retired: true,
    name: "Mint grey and green",
    palette: {
      bg: "#EFF5F1",
      surface: "#FFFFFF",
      ink: "#16302A",
      accent: "#1E8456",
      alt: "#D8EBE0",
    },
  },
  {
    id: "cream-olive",
    name: "Cream and olive",
    palette: {
      bg: "#F6F5EC",
      surface: "#FFFFFF",
      ink: "#2B3322",
      accent: "#5E7C34",
      alt: "#E6EBD3",
    },
  },
  {
    id: "lavender-indigo",
    retired: true,
    name: "Lavender and indigo",
    palette: {
      bg: "#F4F2F9",
      surface: "#FFFFFF",
      ink: "#2A2640",
      accent: "#5848A6",
      alt: "#E4DFF3",
    },
  },
  {
    id: "white-plum",
    name: "White and plum",
    palette: {
      bg: "#FFFFFF",
      surface: "#F8F3F7",
      ink: "#231C2A",
      accent: "#6B2F5E",
      alt: "#F1E7F0",
    },
  },
  {
    id: "stone-slate",
    name: "Stone and slate",
    palette: {
      bg: "#F4F1EC",
      surface: "#FBF9F6",
      ink: "#26323A",
      accent: "#2E4A5A",
      alt: "#E6DFD3",
    },
  },
  {
    id: "sand-clay",
    retired: true,
    name: "Sand and clay",
    palette: {
      bg: "#F6EFE6",
      surface: "#FFFCF8",
      ink: "#33261E",
      accent: "#B5543A",
      alt: "#EFE0CE",
    },
  },
  {
    id: "stone-terracotta",
    name: "Stone and terracotta",
    palette: {
      bg: "#FBFAF7",
      surface: "#FFFFFF",
      ink: "#2D2A26",
      accent: "#A24F2F",
      alt: "#E9E3D8",
    },
  },
  {
    id: "paper-walnut",
    name: "Paper and walnut",
    palette: {
      bg: "#FAF5EA",
      surface: "#FFFDF8",
      ink: "#3A2B20",
      accent: "#8A5A36",
      alt: "#EFE4CF",
    },
  },
  {
    id: "golden-hour",
    name: "Golden hour",
    originalTheme: "golden-hour",
    palette: {
      bg: "#FFFFFF",
      surface: "#FFFFFF",
      ink: "#1B2430",
      accent: "#FFD74D",
      alt: "#DDEEF6",
    },
  },
  {
    id: "denim-oat",
    name: "Denim and oat",
    originalTheme: "blue-sand",
    palette: {
      bg: "#FAF6ED",
      surface: "#FFFDF8",
      ink: "#1B2230",
      accent: "#3F6AA8",
      alt: "#EFE7D6",
    },
  },
  {
    id: "stone-forest",
    name: "Stone and forest",
    palette: {
      bg: "#FAFAF9",
      surface: "#FFFFFF",
      ink: "#1C1917",
      accent: "#3B6651",
      alt: "#E8F0DF",
    },
  },
  {
    id: "navy-mint",
    name: "Navy and mint (dark)",
    palette: {
      bg: "#0E1A2B",
      surface: "#16263D",
      ink: "#E8EEF5",
      accent: "#5CC6B1",
      alt: "#1F3552",
      dark: true,
    },
  },
  {
    id: "forest-mint",
    name: "Forest and mint (dark)",
    palette: {
      bg: "#0F211B",
      surface: "#17302A",
      ink: "#E6F2EC",
      accent: "#7FD1A8",
      alt: "#1D3D33",
      dark: true,
    },
  },
];

/** The schemes the picker offers. */
export const PICKABLE_SCHEMES = SCHEMES.filter((s) => !s.retired);

export const SCHEME_IDS = SCHEMES.map((s) => s.id);
export const isSchemeId = (value: unknown): value is SchemeId =>
  SCHEME_IDS.includes(value as SchemeId);
export const getScheme = (id: SchemeId | undefined): Scheme =>
  SCHEMES.find((s) => s.id === id) ?? SCHEMES[0];

// ---- Typefaces ----

export type FontPairId =
  | "inter"
  | "jakarta"
  | "lexend-source"
  | "atkinson"
  | "nunito"
  | "sourceserif-sans"
  | "fraunces-public"
  | "newsreader-inter"
  | "instrument";

/** What an older save's pair stands for: its heading face and its text face. */
const FONT_PAIRS: { id: FontPairId; heading: FaceId; text: FaceId }[] = [
  { id: "inter", heading: "inter", text: "inter" },
  { id: "jakarta", heading: "jakarta", text: "jakarta" },
  { id: "lexend-source", heading: "lexend", text: "source" },
  { id: "atkinson", heading: "atkinson", text: "atkinson" },
  { id: "nunito", heading: "nunito", text: "nunito-sans" },
  { id: "sourceserif-sans", heading: "source-serif", text: "source" },
  { id: "fraunces-public", heading: "fraunces", text: "public" },
  { id: "newsreader-inter", heading: "newsreader", text: "inter" },
  { id: "instrument", heading: "instrument", text: "instrument-sans" },
];

export const FONT_PAIR_IDS = FONT_PAIRS.map((f) => f.id);

/**
 * The same typefaces, chosen one at a time: one for headings and one for text. A face that can be a heading carries the
 * weight, tracking and size that suit it there. Older saves chose a pair above, which is split into its two faces.
 */
export type FaceId =
  | "inter"
  | "jakarta"
  | "lexend"
  | "source"
  | "atkinson"
  | "nunito"
  | "nunito-sans"
  | "source-serif"
  | "fraunces"
  | "public"
  | "newsreader"
  | "instrument"
  | "instrument-sans";

export interface Face {
  id: FaceId;
  name: string;
  /** CSS variable set by next/font. */
  var: string;
  /** Set when the face is offered for headings. */
  heading?: { weight: number; tracking: string; scale: number };
  /** Set when the face is offered for text. */
  text?: true;
}

export const FACES: Face[] = [
  {
    id: "inter",
    name: "Inter",
    var: "--font-inter",
    heading: { weight: 700, tracking: "-0.03em", scale: 0.97 },
    text: true,
  },
  {
    id: "jakarta",
    name: "Plus Jakarta Sans",
    var: "--f-jakarta",
    heading: { weight: 700, tracking: "-0.02em", scale: 0.97 },
    text: true,
  },
  {
    id: "lexend",
    name: "Lexend",
    var: "--f-lexend",
    heading: { weight: 600, tracking: "-0.015em", scale: 0.94 },
    text: true,
  },
  {
    id: "atkinson",
    name: "Atkinson Hyperlegible",
    var: "--f-atkinson",
    heading: { weight: 700, tracking: "-0.01em", scale: 0.97 },
    text: true,
  },
  {
    id: "nunito",
    name: "Nunito",
    var: "--f-nunito",
    heading: { weight: 800, tracking: "-0.01em", scale: 0.96 },
  },
  {
    id: "source-serif",
    name: "Source Serif",
    var: "--f-sourceserif",
    heading: { weight: 600, tracking: "-0.01em", scale: 1 },
    text: true,
  },
  {
    id: "fraunces",
    name: "Fraunces",
    var: "--font-fraunces",
    heading: { weight: 500, tracking: "-0.015em", scale: 1 },
  },
  {
    id: "newsreader",
    name: "Newsreader",
    var: "--f-newsreader",
    heading: { weight: 500, tracking: "-0.01em", scale: 1.03 },
    text: true,
  },
  {
    id: "instrument",
    name: "Instrument Serif",
    var: "--f-instrument",
    heading: { weight: 400, tracking: "-0.005em", scale: 1.1 },
  },
  { id: "source", name: "Source Sans", var: "--f-source", text: true },
  { id: "nunito-sans", name: "Nunito Sans", var: "--f-nunitosans", text: true },
  { id: "public", name: "Public Sans", var: "--f-public", text: true },
  {
    id: "instrument-sans",
    name: "Instrument Sans",
    var: "--f-instrsans",
    text: true,
  },
];

export const HEADING_FACES = FACES.filter((f) => f.heading);
export const TEXT_FACES = FACES.filter((f) => f.text);
export const isHeadingFace = (v: unknown): v is FaceId =>
  HEADING_FACES.some((f) => f.id === v);
export const isTextFace = (v: unknown): v is FaceId =>
  TEXT_FACES.some((f) => f.id === v);
export const getFace = (id: FaceId): Face => FACES.find((f) => f.id === id)!;

/** The two faces an older saved pair stands for. */
export const pairFaces = (
  id: FontPairId | undefined,
): { heading: FaceId; text: FaceId } => {
  const pair = FONT_PAIRS.find((p) => p.id === id) ?? FONT_PAIRS[0];
  return { heading: pair.heading, text: pair.text };
};

export interface ResolvedFont {
  /** CSS variables for headings and text. */
  display: string;
  body: string;
  weight: number;
  tracking: string;
  scale: number;
}

/** For the original design, only what was chosen: a face left alone keeps the design's own Fraunces or Inter. */
export function chosenFaces(style?: {
  font?: FontPairId;
  headingFont?: FaceId;
  textFont?: FaceId;
}): { display?: string; body?: string } {
  const pair = style?.font ? pairFaces(style.font) : undefined;
  const heading = style?.headingFont ?? pair?.heading;
  const text = style?.textFont ?? pair?.text;
  return {
    display: heading && FACES.find((f) => f.id === heading)?.var,
    body: text && FACES.find((f) => f.id === text)?.var,
  };
}

/** The faces a profile uses: its own heading and text choices, then the saved pair, then the default pair. */
export function resolveFont(style?: {
  font?: FontPairId;
  headingFont?: FaceId;
  textFont?: FaceId;
}): ResolvedFont {
  const pair = pairFaces(style?.font ?? DEFAULT_FONT);
  const heading = FACES.find(
    (f) => f.id === (style?.headingFont ?? pair.heading),
  )!;
  const text = FACES.find((f) => f.id === (style?.textFont ?? pair.text))!;
  const h = heading.heading!;
  return {
    display: heading.var,
    body: text.var,
    weight: h.weight,
    tracking: h.tracking,
    scale: h.scale,
  };
}

// ---- Photo shapes ----

export const PHOTO_SHAPES: { id: PhotoShape; name: string }[] = [
  { id: "circle", name: "Circle" },
  { id: "rounded", name: "Rounded" },
  { id: "oval", name: "Oval" },
  { id: "square", name: "Square" },
  { id: "blob", name: "Organic" },
];

// ---- Layouts: structure only ----

export type LayoutId = "rail-card" | "link-page";

export interface LayoutSpec {
  id: LayoutId;
  /** The family it belongs to, shown as a heading in the picker. */
  family: string;
  name: string;
  /** What is different about the structure. Never mentions colour or type. */
  description: string;
  layout: LayoutKind;
  /** How the identity block is drawn. Each layout reads it its own way (see layoutsA and layoutsB). */
  header?: "card" | "band" | "plain";
  /** Which colour fills the coloured areas (header band, side panel): the accent, or its soft tint. */
  tone?: "accent" | "alt";
  /** A soft wash from the tint down into the page behind the content. */
  wash?: boolean;
  expertise: ExpertiseStyle;
  services: ServicesStyle;
  journey: JourneyStyle;
  /** Corner radius of cards and panels, in px. */
  radius: number;
}

export const LAYOUTS: LayoutSpec[] = [
  {
    id: "link-page",
    family: "Link page",
    name: "Link page",
    description:
      "A plain personal page: your photo, name and links stay fixed on the left, and a card for each session, service, qualification and contact detail sits on the right. Only what you have filled in is shown.",
    layout: "linkpage",
    expertise: "chips",
    services: "cards",
    journey: "cards",
    radius: 20,
  },
  {
    id: "rail-card",
    family: "Booking rail",
    name: "Card header",
    description:
      "Your photo and name centred at the top, then one section after another in a single column, with a booking bar that stays at the bottom of the screen.",
    layout: "rail",
    header: "card",
    wash: true,
    expertise: "chips",
    services: "checks",
    journey: "rows",
    radius: 18,
  },
];

export const LAYOUT_IDS = LAYOUTS.map((l) => l.id);
export const LAYOUT_FAMILIES = [...new Set(LAYOUTS.map((l) => l.family))];
export const isLayoutId = (value: unknown): value is LayoutId =>
  LAYOUT_IDS.includes(value as LayoutId);
export const getLayout = (id: LayoutId): LayoutSpec =>
  LAYOUTS.find((l) => l.id === id) ??
  LAYOUTS.find((l) => l.id === "rail-card")!;

export const DEFAULT_SCHEME: SchemeId = "moss-honey";
export const DEFAULT_FONT: FontPairId = "jakarta";
export const DEFAULT_SHAPE: PhotoShape = "circle";
/** The original design's own photo shape. */
export const ORIGINAL_SHAPE: PhotoShape = "blob";

// ---- What a practitioner chooses ----

export interface ProfileStyle {
  scheme?: SchemeId;
  /** An older save's pair; headingFont and textFont replace it. */
  font?: FontPairId;
  headingFont?: FaceId;
  textFont?: FaceId;
  shape?: PhotoShape;
  /** Which of the two ways to colour the page is in use. The other's choices are kept, unused. */
  colorMode?: ColorMode;
  /** The person's own colours. Used only in "custom" mode, on top of the neutral base, never on a scheme. */
  colors?: ColorChoices;
}

export type ColorMode = "scheme" | "custom";
const isColorMode = (v: unknown): v is ColorMode =>
  v === "scheme" || v === "custom";

const isFont = (v: unknown): v is FontPairId =>
  FONT_PAIR_IDS.includes(v as FontPairId);
const isShape = (v: unknown): v is PhotoShape =>
  PHOTO_SHAPES.some((s) => s.id === v);

/** Keeps only valid choices, so a stored or submitted value can never put anything odd into the page's styles. */
export function cleanStyle(
  input:
    | {
        colors?: unknown;
        colorMode?: unknown;
        scheme?: unknown;
        font?: unknown;
        headingFont?: unknown;
        textFont?: unknown;
        shape?: unknown;
      }
    | null
    | undefined,
): ProfileStyle | undefined {
  if (!input) return undefined;
  const style: ProfileStyle = {};
  if (isSchemeId(input.scheme)) style.scheme = input.scheme;
  if (isFont(input.font)) style.font = input.font;
  if (isHeadingFace(input.headingFont)) style.headingFont = input.headingFont;
  if (isTextFace(input.textFont)) style.textFont = input.textFont;
  if (isShape(input.shape)) style.shape = input.shape;
  if (isColorMode(input.colorMode)) style.colorMode = input.colorMode;
  const colors = cleanColors(input.colors);
  if (colors) style.colors = colors;
  return Object.keys(style).length ? style : undefined;
}

export function parseStyleJson(
  raw: string | null | undefined,
): ProfileStyle | undefined {
  if (!raw) return undefined;
  try {
    return cleanStyle(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

// ---- Older saves: a whole template named by one id ----

/** What each earlier whole template was made of, so a profile that chose one keeps the same look. */
const PRESETS: Record<string, [LayoutId, SchemeId, FontPairId, PhotoShape]> = {
  clearwater: ["rail-card", "sky-green", "jakarta", "rounded"],
  harbour: ["rail-card", "sand-petrol", "lexend-source", "circle"],
  "sage-room": ["rail-card", "sage", "sourceserif-sans", "rounded"],
  "evening-calm": ["rail-card", "navy-mint", "jakarta", "circle"],
  compass: ["rail-card", "teal-white", "jakarta", "circle"],
  "lilac-hour": ["rail-card", "lavender-indigo", "nunito", "circle"],
  "meadow-practice": [
    "rail-card",
    "cream-olive",
    "sourceserif-sans",
    "rounded",
  ],
  "bright-practice": ["rail-card", "clinic-blue", "jakarta", "rounded"],
  "garden-clinic": ["rail-card", "leaf-green", "fraunces-public", "rounded"],
  "quiet-practice": ["rail-card", "stone-slate", "instrument", "rounded"],
  "primary-care": ["rail-card", "grey-navy", "jakarta", "circle"],
  "everyday-health": ["rail-card", "mint-green", "atkinson", "circle"],
  "warm-reception": ["rail-card", "sand-clay", "fraunces-public", "circle"],
  letter: ["rail-card", "white-plum", "newsreader-inter", "rounded"],
  journal: ["rail-card", "paper-walnut", "newsreader-inter", "rounded"],
  "open-window": ["rail-card", "sky-blue", "newsreader-inter", "oval"],
  "pocket-practice": ["rail-card", "soft-teal", "nunito", "circle"],
  "pocket-evening": ["rail-card", "forest-mint", "jakarta", "circle"],
  anchor: ["rail-card", "deep-teal", "sourceserif-sans", "circle"],
  "stone-panel": [
    "rail-card",
    "stone-terracotta",
    "fraunces-public",
    "rounded",
  ],
  // The very first set.
  linen: ["rail-card", "sage", "sourceserif-sans", "rounded"],
  atelier: ["rail-card", "stone-slate", "instrument", "rounded"],
  tidepool: ["rail-card", "teal-white", "jakarta", "circle"],
  "midnight-study": ["rail-card", "navy-mint", "jakarta", "circle"],
  citrine: ["rail-card", "clinic-blue", "jakarta", "rounded"],
  orchard: ["rail-card", "leaf-green", "fraunces-public", "rounded"],
  paperback: ["rail-card", "paper-walnut", "newsreader-inter", "rounded"],
  dusk: ["rail-card", "lavender-indigo", "nunito", "circle"],
  "slate-and-sun": ["rail-card", "grey-navy", "jakarta", "circle"],
  cedar: ["rail-card", "stone-terracotta", "fraunces-public", "rounded"],
  "meadow-notes": ["rail-card", "cream-olive", "sourceserif-sans", "rounded"],
  "bauhaus-calm": ["rail-card", "clinic-blue", "jakarta", "rounded"],
  "quiet-hour": ["rail-card", "white-plum", "newsreader-inter", "rounded"],
  "terracotta-arch": ["rail-card", "sand-clay", "fraunces-public", "circle"],
  harbor: ["rail-card", "sand-petrol", "lexend-source", "circle"],
  moonlit: ["rail-card", "forest-mint", "jakarta", "circle"],
  peony: ["rail-card", "lavender-indigo", "nunito", "circle"],
  "studio-mono": ["rail-card", "grey-navy", "jakarta", "circle"],
  saffron: ["rail-card", "sand-clay", "fraunces-public", "circle"],
  daybreak: ["rail-card", "sky-green", "jakarta", "rounded"],
};

/**
 * A stored template and style as the page should use them. A layout id stays as it is. An older whole-template id becomes
 * its layout, with that template's colours, typeface and photo shape filled in underneath whatever the style already says.
 * Anything unknown is no template, which is the original design.
 */
/** What the original design keeps of a profile's style: its colour scheme and typeface. */
const originalOnly = (
  style: ProfileStyle | undefined,
): ProfileStyle | undefined => {
  const kept: ProfileStyle = {};
  if (style?.scheme) kept.scheme = style.scheme;
  if (style?.font) kept.font = style.font;
  if (style?.headingFont) kept.headingFont = style.headingFont;
  if (style?.textFont) kept.textFont = style.textFont;
  if (style?.shape) kept.shape = style.shape;
  if (style?.colorMode) kept.colorMode = style.colorMode;
  if (style?.colors) kept.colors = style.colors;
  return Object.keys(kept).length ? kept : undefined;
};

export function normalizeSelection(
  stored: string | null | undefined,
  style: ProfileStyle | undefined,
): { template: LayoutId | undefined; style: ProfileStyle | undefined } {
  if (isLayoutId(stored)) return { template: stored, style };
  const preset = stored ? PRESETS[stored] : undefined;
  // No layout is the original design, which keeps only its colour scheme and typeface.
  if (!preset)
    return {
      template: undefined,
      style: stored ? undefined : originalOnly(style),
    };
  const [layout, scheme, font, shape] = preset;
  return { template: layout, style: { scheme, font, shape, ...style } };
}

// ---- Putting a layout and a practitioner's choices together ----

export interface ResolvedDesign {
  spec: LayoutSpec;
  palette: Palette;
  font: ResolvedFont;
  shape: PhotoShape;
  /** CSS variables for the page root. */
  vars: Record<string, string>;
}

// ---- Colours for single parts of the page ----

/** A colour for each part of the page that can be set apart from the scheme. Anything left out keeps the scheme's. */
export interface ColorChoices {
  /** The page behind everything. */
  page?: string;
  /** Panels, tiles and soft highlights. */
  panels?: string;
  /** Headings and text. */
  text?: string;
  /** Buttons, links and small marks. */
  accent?: string;
  /** The border around the whole page. Only the original design has one. */
  frame?: string;
  /** The ring around the photo. Follows the frame until set. Only the original design has one. */
  ring?: string;
  /** The highlight behind section headings. Only the original design has one. */
  underline?: string;
  /** The soft tint behind badges, hovers and the photo. Worked out from the accent until set. */
  hi?: string;
}

export const COLOR_PARTS = ["page", "panels", "text", "accent", "frame", "ring", "underline", "hi"] as const;

/** Keeps only plain #rrggbb colours, so nothing else can reach the page's styles. */
export function cleanColors(input: unknown): ColorChoices | undefined {
  if (!input || typeof input !== "object") return undefined;
  const out: ColorChoices = {};
  for (const part of COLOR_PARTS) {
    const value = (input as Record<string, unknown>)[part];
    if (typeof value === "string" && HEX.test(value.trim()))
      out[part] = value.trim().toLowerCase();
  }
  return Object.keys(out).length ? out : undefined;
}

/** Moves a colour toward the end that reads on `bg` until it reaches `ratio`, so a choice never disappears into the page. */
function readable(color: string, bg: string, ratio: number): string {
  if (contrast(color, bg) >= ratio) return color;
  const toward = isDark(bg) ? "#ffffff" : "#000000";
  for (let t = 0.1; t <= 1; t += 0.1) {
    const next = mix(toward, color, t);
    if (contrast(next, bg) >= ratio) return next;
  }
  return toward;
}

/**
 * The scheme's palette with the colours picked for single parts laid over it. A dark or light page that changes the
 * scheme's mood brings matching text and cards with it, and text and accent are kept readable on whatever page results.
 */
export function resolvePalette(base: Palette, choices?: ColorChoices): Palette {
  if (!choices) return base;
  const bg = choices.page ?? base.bg;
  const dark = choices.page ? isDark(bg) : Boolean(base.dark);
  const flipped = dark !== Boolean(base.dark);
  const surface = choices.page
    ? dark
      ? mix("#ffffff", bg, 0.08)
      : mix("#ffffff", bg, 0.6)
    : base.surface;
  const ink = readable(
    choices.text ?? (flipped ? (dark ? "#e8eef5" : "#17262c") : base.ink),
    bg,
    4.5,
  );
  const accent = readable(choices.accent ?? base.accent, bg, 3);
  const alt =
    choices.panels ??
    (choices.accent || choices.page
      ? mix(accent, bg, dark ? 0.3 : 0.14)
      : base.alt);
  return { bg, surface, ink, accent, alt, dark };
}

/**
 * Where a person's own colours start: plain white, near-black text, light grey panels and one slate accent, so every
 * colour on the page is one they chose. Not a scheme, so the picker never offers it, and it has nothing to do with the
 * ready-made scheme they may have picked.
 */
export const CUSTOM_BASE: Palette = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  ink: "#1F2933",
  accent: "#334155",
  alt: "#F1F3F5",
};

/**
 * The person's own colours, if the page is using them. "Ready-made" ignores them (they are kept for later); a page saved
 * before there were two modes has no mode and uses whatever colours it has on top of its scheme.
 */
export function activeColors(style?: ProfileStyle): ColorChoices | undefined {
  return style?.colorMode === "scheme" ? undefined : style?.colors;
}

/** The colours a page really has: a ready-made scheme alone, or the person's own colours alone. Never a mix of the two. */
export function effectivePalette(style?: ProfileStyle): Palette {
  const base =
    style?.colorMode === "custom"
      ? CUSTOM_BASE
      : getScheme(style?.scheme ?? DEFAULT_SCHEME).palette;
  return resolvePalette(base, activeColors(style));
}

export function resolveDesign(
  id: LayoutId,
  style?: ProfileStyle,
): ResolvedDesign {
  const spec = getLayout(id);
  const palette = effectivePalette(style);
  const font = resolveFont(style);
  const shape = style?.shape ?? DEFAULT_SHAPE;
  const { bg, surface, ink, accent, alt } = palette;
  const border = mix(ink, bg, palette.dark ? 0.18 : 0.12);
  const accentOn = readableOn(accent);
  const hi = activeColors(style)?.hi;
  const altOn = contrast(alt, ink) >= contrast(alt, bg) ? ink : bg;
  const tone = spec.tone === "accent" ? accent : alt;
  const toneOn = spec.tone === "accent" ? accentOn : altOn;

  const vars: Record<string, string> = {
    "--pt-bg": bg,
    "--pt-surface": surface,
    "--pt-text": ink,
    "--pt-tagline": mix(ink, bg, 0.84),
    "--pt-muted": mix(ink, bg, 0.64),
    "--pt-border": border,
    "--pt-accent": accent,
    "--pt-accent-hover": darken(accent, 0.14),
    "--pt-accent-foreground": accentOn,
    "--pt-accent-text":
      contrast(accent, bg) >= 4.5 ? accent : readableOn(bg, accent, ink),
    "--pt-alt": alt,
    "--pt-alt-foreground": altOn,
    "--pt-tone": tone,
    "--pt-tone-foreground": toneOn,
    "--pt-tone-muted": mix(toneOn, tone, 0.72),
    "--pt-tone-border": mix(toneOn, tone, 0.24),
    "--pt-tint": hi ? mix(hi, bg, 0.5) : mix(accent, bg, 0.1),
    "--pt-tint-strong": hi ?? mix(accent, bg, 0.2),
    "--pt-outer": alt,
    "--pt-input-bg": mix(ink, bg, 0.05),
    "--pt-input-border": border,
    "--pt-modal-sidebar": accent,
    "--pt-modal-sidebar-fg": accentOn,
    "--pt-r": `${spec.radius}px`,
    "--pt-btn": `${Math.min(spec.radius, 12)}px`,
    "--pt-ok": palette.dark ? "#4ade80" : "#15803d",
    "--pt-ds": String(font.scale),
    "--pt-display": `var(${font.display})`,
    "--pt-body": `var(${font.body})`,
    "--pt-display-weight": String(font.weight),
    "--pt-display-tracking": font.tracking,
    "--pt-label": `var(${font.body})`,
    "--pt-page": spec.wash
      ? `linear-gradient(180deg, ${alt} 0, ${bg} 38rem)`
      : bg,
  };

  return {
    spec,
    palette,
    font,
    shape,
    vars,
  };
}

const channels = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/**
 * The colour scheme whose page and accent colours are closest to one of the original design's colour themes. A profile
 * that has no scheme yet is shown, and edited, in this one, so what the picker marks is what the page uses.
 */
export function nearestScheme(colorTheme: string | undefined): SchemeId {
  const theme = COLOR_THEMES.find((t) => t.id === colorTheme);
  if (!theme) return DEFAULT_SCHEME;
  const gap = (a: string, b: string) =>
    channels(a).reduce((sum, v, i) => sum + (v - channels(b)[i]) ** 2, 0);
  const distance = (s: Scheme) =>
    gap(s.palette.bg, theme.swatches[0]) +
    gap(s.palette.accent, theme.swatches[2]);
  return PICKABLE_SCHEMES.reduce((best, s) =>
    distance(s) < distance(best) ? s : best,
  ).id;
}
