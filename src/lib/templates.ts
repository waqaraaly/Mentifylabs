import { HEX, contrast, darken, mix, readableOn } from "@/lib/color";

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
 */
export type LayoutKind = "rail" | "tabs" | "clinic" | "directory" | "narrative" | "card" | "panel";
export type PhotoShape = "circle" | "rounded" | "oval" | "square";
export type ExpertiseStyle = "chips" | "bullets" | "checks" | "tiles" | "cloud";
export type ServicesStyle = "bullets" | "checks" | "cards" | "rows";
export type JourneyStyle = "rail" | "rows" | "cards";
export type SectionKey = "stats" | "expertise" | "services" | "journey";

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
  | "sky-blue"
  | "soft-teal"
  | "forest-mint"
  | "deep-teal"
  | "stone-terracotta";

export interface Scheme {
  id: SchemeId;
  name: string;
  palette: Palette;
}

/** Calm, health-appropriate colours: teal, blue, green, sage, plum, warm neutrals, and two dark options. */
export const SCHEMES: Scheme[] = [
  { id: "teal-white", name: "Teal on white", palette: { bg: "#FFFFFF", surface: "#FFFFFF", ink: "#14303A", accent: "#00808A", alt: "#E3F3F4" } },
  { id: "clinic-blue", name: "Clinic blue", palette: { bg: "#FFFFFF", surface: "#F3F7FC", ink: "#14263F", accent: "#2563A8", alt: "#E6EEF8" } },
  { id: "sky-green", name: "Sky and green", palette: { bg: "#EAF2FA", surface: "#FFFFFF", ink: "#16283A", accent: "#0F6B52", alt: "#D5E6F5" } },
  { id: "sky-blue", name: "Pale sky and blue", palette: { bg: "#F1F7FC", surface: "#FFFFFF", ink: "#1B2C3C", accent: "#2C6E9B", alt: "#D9EAF6" } },
  { id: "grey-navy", name: "Cool grey and navy", palette: { bg: "#EEF2F7", surface: "#FFFFFF", ink: "#12263D", accent: "#0F4C81", alt: "#DCE7F3" } },
  { id: "soft-teal", name: "Soft teal", palette: { bg: "#DDEFF0", surface: "#FFFFFF", ink: "#123238", accent: "#0E7C86", alt: "#BFE1E3" } },
  { id: "deep-teal", name: "Deep teal", palette: { bg: "#FFFFFF", surface: "#F2F7F7", ink: "#17323A", accent: "#0F5964", alt: "#E1EEEF" } },
  { id: "sand-petrol", name: "Sand and petrol", palette: { bg: "#FFFFFF", surface: "#FFFFFF", ink: "#17262E", accent: "#0B6E84", alt: "#EEE8DB" } },
  { id: "sage", name: "Sage on white", palette: { bg: "#FBFCFA", surface: "#FFFFFF", ink: "#1F2D26", accent: "#4A7A5C", alt: "#E8F0EA" } },
  { id: "leaf-green", name: "Leaf green", palette: { bg: "#F3F8F3", surface: "#FFFFFF", ink: "#1E3328", accent: "#2F7D5B", alt: "#DCEBDD" } },
  { id: "mint-green", name: "Mint grey and green", palette: { bg: "#EFF5F1", surface: "#FFFFFF", ink: "#16302A", accent: "#1E8456", alt: "#D8EBE0" } },
  { id: "cream-olive", name: "Cream and olive", palette: { bg: "#F6F5EC", surface: "#FFFFFF", ink: "#2B3322", accent: "#5E7C34", alt: "#E6EBD3" } },
  { id: "lavender-indigo", name: "Lavender and indigo", palette: { bg: "#F4F2F9", surface: "#FFFFFF", ink: "#2A2640", accent: "#5848A6", alt: "#E4DFF3" } },
  { id: "white-plum", name: "White and plum", palette: { bg: "#FFFFFF", surface: "#F8F3F7", ink: "#231C2A", accent: "#6B2F5E", alt: "#F1E7F0" } },
  { id: "stone-slate", name: "Stone and slate", palette: { bg: "#F4F1EC", surface: "#FBF9F6", ink: "#26323A", accent: "#2E4A5A", alt: "#E6DFD3" } },
  { id: "sand-clay", name: "Sand and clay", palette: { bg: "#F6EFE6", surface: "#FFFCF8", ink: "#33261E", accent: "#B5543A", alt: "#EFE0CE" } },
  { id: "stone-terracotta", name: "Stone and terracotta", palette: { bg: "#FBFAF7", surface: "#FFFFFF", ink: "#2D2A26", accent: "#A24F2F", alt: "#E9E3D8" } },
  { id: "paper-walnut", name: "Paper and walnut", palette: { bg: "#FAF5EA", surface: "#FFFDF8", ink: "#3A2B20", accent: "#8A5A36", alt: "#EFE4CF" } },
  { id: "navy-mint", name: "Navy and mint (dark)", palette: { bg: "#0E1A2B", surface: "#16263D", ink: "#E8EEF5", accent: "#5CC6B1", alt: "#1F3552", dark: true } },
  { id: "forest-mint", name: "Forest and mint (dark)", palette: { bg: "#0F211B", surface: "#17302A", ink: "#E6F2EC", accent: "#7FD1A8", alt: "#1D3D33", dark: true } },
];

export const SCHEME_IDS = SCHEMES.map((s) => s.id);
export const isSchemeId = (value: unknown): value is SchemeId => SCHEME_IDS.includes(value as SchemeId);
export const getScheme = (id: SchemeId | undefined): Scheme => SCHEMES.find((s) => s.id === id) ?? SCHEMES[0];

// ---- Typefaces ----

export type FontPairId = "jakarta" | "lexend-source" | "atkinson" | "nunito" | "sourceserif-sans" | "fraunces-public" | "newsreader-inter" | "instrument";

export interface FontPair {
  id: FontPairId;
  name: string;
  note: string;
  /** CSS variables set by next/font (see components/practitioner/templates/fonts.ts). */
  display: string;
  body: string;
  weight: number;
  tracking: string;
  /** Faces differ in how big they look at the same size; this evens the headings out. Kept within a few per cent. */
  scale: number;
}

export const FONT_PAIRS: FontPair[] = [
  { id: "jakarta", name: "Modern sans", note: "Plus Jakarta Sans", display: "--f-jakarta", body: "--f-jakarta", weight: 700, tracking: "-0.02em", scale: 0.97 },
  { id: "lexend-source", name: "Easy to read", note: "Lexend and Source Sans", display: "--f-lexend", body: "--f-source", weight: 600, tracking: "-0.015em", scale: 0.94 },
  { id: "atkinson", name: "Maximum legibility", note: "Atkinson Hyperlegible", display: "--f-atkinson", body: "--f-atkinson", weight: 700, tracking: "-0.01em", scale: 0.97 },
  { id: "nunito", name: "Friendly and rounded", note: "Nunito and Nunito Sans", display: "--f-nunito", body: "--f-nunitosans", weight: 800, tracking: "-0.01em", scale: 0.96 },
  { id: "sourceserif-sans", name: "Calm serif", note: "Source Serif and Source Sans", display: "--f-sourceserif", body: "--f-source", weight: 600, tracking: "-0.01em", scale: 1 },
  { id: "fraunces-public", name: "Warm serif", note: "Fraunces and Public Sans", display: "--font-fraunces", body: "--f-public", weight: 500, tracking: "-0.015em", scale: 1 },
  { id: "newsreader-inter", name: "Editorial serif", note: "Newsreader and Inter", display: "--f-newsreader", body: "--font-inter", weight: 500, tracking: "-0.01em", scale: 1.03 },
  { id: "instrument", name: "Refined serif", note: "Instrument Serif and Sans", display: "--f-instrument", body: "--f-instrsans", weight: 400, tracking: "-0.005em", scale: 1.1 },
];

export const FONT_PAIR_IDS = FONT_PAIRS.map((f) => f.id);
export const getFontPair = (id: FontPairId | undefined): FontPair => FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0];

// ---- Photo shapes, accent colours, sections ----

export const PHOTO_SHAPES: { id: PhotoShape; name: string }[] = [
  { id: "circle", name: "Circle" },
  { id: "rounded", name: "Rounded" },
  { id: "oval", name: "Oval" },
  { id: "square", name: "Square" },
];

/** Accent colours offered on top of each scheme's own. The practitioner can also pick any colour. All are calm, health-appropriate hues. */
export const ACCENT_PRESETS: { name: string; hex: string }[] = [
  { name: "Teal", hex: "#0B7285" },
  { name: "Sea green", hex: "#1E8456" },
  { name: "Sage", hex: "#4A7A5C" },
  { name: "Olive", hex: "#66742F" },
  { name: "Sky blue", hex: "#2B6FA8" },
  { name: "Navy", hex: "#1F3F6E" },
  { name: "Indigo", hex: "#4B4C9E" },
  { name: "Plum", hex: "#6B2F5E" },
  { name: "Rose", hex: "#A8456B" },
  { name: "Clay", hex: "#B5543A" },
  { name: "Walnut", hex: "#7A5436" },
  { name: "Slate", hex: "#34495A" },
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  stats: "Quick facts (experience, fee, session format)",
  expertise: "Areas of expertise",
  services: "Services offered",
  journey: "Education and experience",
};
export const SECTION_KEYS = Object.keys(SECTION_LABELS) as SectionKey[];

// ---- Layouts: structure only ----

export type LayoutId =
  | "rail-card"
  | "rail-band"
  | "rail-plain"
  | "tabs-plain"
  | "tabs-card"
  | "tabs-band"
  | "clinic-split"
  | "clinic-centered"
  | "clinic-compact"
  | "directory-card"
  | "directory-band"
  | "directory-flat"
  | "narrative-right"
  | "narrative-left"
  | "narrative-centered"
  | "digital-card"
  | "side-panel";

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
  { id: "rail-card", family: "Booking rail", name: "Card header", description: "Your details in a card at the top. Sections below, with a booking card that stays in view beside them.", layout: "rail", header: "card", wash: true, expertise: "chips", services: "checks", journey: "rows", radius: 18 },
  { id: "rail-band", family: "Booking rail", name: "Band header", description: "Your details across a full-width band, then sections with the booking card beside them.", layout: "rail", header: "band", tone: "alt", expertise: "bullets", services: "bullets", journey: "rows", radius: 14 },
  { id: "rail-plain", family: "Booking rail", name: "Open page", description: "No boxes: sections separated by fine lines, with the booking card beside them.", layout: "rail", header: "plain", expertise: "chips", services: "checks", journey: "rail", radius: 10 },
  { id: "tabs-plain", family: "Tabbed profile", name: "Plain top", description: "Your details and the booking card side by side, then a tab bar that stays under the top of the screen.", layout: "tabs", header: "plain", expertise: "chips", services: "bullets", journey: "rows", radius: 14 },
  { id: "tabs-card", family: "Tabbed profile", name: "Tinted top", description: "Like the plain top, on a tinted band behind your details and the booking card.", layout: "tabs", header: "card", expertise: "chips", services: "checks", journey: "rail", radius: 20 },
  { id: "tabs-band", family: "Tabbed profile", name: "Colour band top", description: "Like the plain top, on a full colour band.", layout: "tabs", header: "band", tone: "alt", expertise: "tiles", services: "bullets", journey: "rail", radius: 14 },
  { id: "clinic-split", family: "Practice website", name: "Photo beside text", description: "A site-style menu, a first screen with your photo beside your introduction, then banded sections and a closing call to book.", layout: "clinic", header: "card", expertise: "tiles", services: "cards", journey: "rows", radius: 16 },
  { id: "clinic-centered", family: "Practice website", name: "Centred", description: "The same sections with the first screen centred: photo, name and introduction stacked.", layout: "clinic", header: "band", expertise: "chips", services: "cards", journey: "rail", radius: 20 },
  { id: "clinic-compact", family: "Practice website", name: "Quiet introduction", description: "A restrained first screen with a small photo on the left and your next open times in a strip below.", layout: "clinic", header: "plain", expertise: "chips", services: "rows", journey: "rows", radius: 8 },
  { id: "directory-card", family: "Directory card", name: "Profile card", description: "One compact column for phones: a profile card with key figures, then a card for each way to meet.", layout: "directory", header: "card", expertise: "chips", services: "rows", journey: "rows", radius: 12 },
  { id: "directory-band", family: "Directory card", name: "Band and photo", description: "The profile card with a band across the top and the photo stepping over its edge.", layout: "directory", header: "band", expertise: "chips", services: "checks", journey: "rows", radius: 16 },
  { id: "directory-flat", family: "Directory card", name: "Open profile", description: "The same compact column with an open profile at the top instead of a card.", layout: "directory", header: "plain", expertise: "chips", services: "checks", journey: "rows", radius: 12 },
  { id: "narrative-right", family: "Narrative", name: "Photo right", description: "Your name large, your headline as a pull-quote and your photo on the right, then your story with a booking card beside it.", layout: "narrative", header: "card", expertise: "chips", services: "bullets", journey: "rows", radius: 12 },
  { id: "narrative-left", family: "Narrative", name: "Photo left", description: "The story page with your photo on the left of your introduction.", layout: "narrative", header: "band", expertise: "cloud", services: "bullets", journey: "rows", radius: 8 },
  { id: "narrative-centered", family: "Narrative", name: "Centred", description: "The story page with photo, name and pull-quote centred above it.", layout: "narrative", header: "plain", expertise: "chips", services: "bullets", journey: "rows", radius: 10 },
  { id: "digital-card", family: "Digital card", name: "Link card", description: "One narrow column of big buttons for sharing a link: details, booking buttons, then folding sections.", layout: "card", expertise: "chips", services: "checks", journey: "rows", radius: 24 },
  { id: "side-panel", family: "Side panel", name: "Side panel", description: "A panel with your photo, details and booking stays in view on one side while the page scrolls beside it.", layout: "panel", tone: "accent", expertise: "chips", services: "bullets", journey: "rail", radius: 12 },
];

export const LAYOUT_IDS = LAYOUTS.map((l) => l.id);
export const LAYOUT_FAMILIES = [...new Set(LAYOUTS.map((l) => l.family))];
export const isLayoutId = (value: unknown): value is LayoutId => LAYOUT_IDS.includes(value as LayoutId);
export const getLayout = (id: LayoutId): LayoutSpec => LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];

export const DEFAULT_SCHEME: SchemeId = "teal-white";
export const DEFAULT_FONT: FontPairId = "jakarta";
export const DEFAULT_SHAPE: PhotoShape = "circle";

// ---- What a practitioner chooses ----

export interface ProfileStyle {
  scheme?: SchemeId;
  /** Replaces the scheme's accent colour (#rrggbb). */
  accent?: string;
  font?: FontPairId;
  shape?: PhotoShape;
  /** Sections switched off. */
  hidden?: SectionKey[];
}

const isFont = (v: unknown): v is FontPairId => FONT_PAIR_IDS.includes(v as FontPairId);
const isShape = (v: unknown): v is PhotoShape => PHOTO_SHAPES.some((s) => s.id === v);
const isSection = (v: unknown): v is SectionKey => SECTION_KEYS.includes(v as SectionKey);

/** Keeps only valid choices, so a stored or submitted value can never put anything odd into the page's styles. */
export function cleanStyle(input: { scheme?: unknown; accent?: unknown; font?: unknown; shape?: unknown; hidden?: unknown } | null | undefined): ProfileStyle | undefined {
  if (!input) return undefined;
  const style: ProfileStyle = {};
  if (isSchemeId(input.scheme)) style.scheme = input.scheme;
  if (typeof input.accent === "string" && HEX.test(input.accent.trim())) style.accent = input.accent.trim().toLowerCase();
  if (isFont(input.font)) style.font = input.font;
  if (isShape(input.shape)) style.shape = input.shape;
  if (Array.isArray(input.hidden)) {
    const hidden = SECTION_KEYS.filter((key) => (input.hidden as unknown[]).includes(key) && isSection(key));
    if (hidden.length) style.hidden = hidden;
  }
  return Object.keys(style).length ? style : undefined;
}

export function parseStyleJson(raw: string | null | undefined): ProfileStyle | undefined {
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
  harbour: ["rail-band", "sand-petrol", "lexend-source", "circle"],
  "sage-room": ["rail-plain", "sage", "sourceserif-sans", "rounded"],
  "evening-calm": ["rail-card", "navy-mint", "jakarta", "circle"],
  compass: ["tabs-plain", "teal-white", "jakarta", "circle"],
  "lilac-hour": ["tabs-card", "lavender-indigo", "nunito", "circle"],
  "meadow-practice": ["tabs-band", "cream-olive", "sourceserif-sans", "rounded"],
  "bright-practice": ["clinic-split", "clinic-blue", "jakarta", "rounded"],
  "garden-clinic": ["clinic-centered", "leaf-green", "fraunces-public", "rounded"],
  "quiet-practice": ["clinic-compact", "stone-slate", "instrument", "rounded"],
  "primary-care": ["directory-card", "grey-navy", "jakarta", "circle"],
  "everyday-health": ["directory-flat", "mint-green", "atkinson", "circle"],
  "warm-reception": ["directory-band", "sand-clay", "fraunces-public", "circle"],
  letter: ["narrative-right", "white-plum", "newsreader-inter", "rounded"],
  journal: ["narrative-left", "paper-walnut", "newsreader-inter", "rounded"],
  "open-window": ["narrative-centered", "sky-blue", "newsreader-inter", "oval"],
  "pocket-practice": ["digital-card", "soft-teal", "nunito", "circle"],
  "pocket-evening": ["digital-card", "forest-mint", "jakarta", "circle"],
  anchor: ["side-panel", "deep-teal", "sourceserif-sans", "circle"],
  "stone-panel": ["side-panel", "stone-terracotta", "fraunces-public", "rounded"],
  // The very first set.
  linen: ["rail-plain", "sage", "sourceserif-sans", "rounded"],
  atelier: ["clinic-compact", "stone-slate", "instrument", "rounded"],
  tidepool: ["tabs-plain", "teal-white", "jakarta", "circle"],
  "midnight-study": ["rail-card", "navy-mint", "jakarta", "circle"],
  citrine: ["clinic-split", "clinic-blue", "jakarta", "rounded"],
  orchard: ["clinic-centered", "leaf-green", "fraunces-public", "rounded"],
  paperback: ["narrative-left", "paper-walnut", "newsreader-inter", "rounded"],
  dusk: ["tabs-card", "lavender-indigo", "nunito", "circle"],
  "slate-and-sun": ["directory-card", "grey-navy", "jakarta", "circle"],
  cedar: ["side-panel", "stone-terracotta", "fraunces-public", "rounded"],
  "meadow-notes": ["tabs-band", "cream-olive", "sourceserif-sans", "rounded"],
  "bauhaus-calm": ["clinic-split", "clinic-blue", "jakarta", "rounded"],
  "quiet-hour": ["narrative-right", "white-plum", "newsreader-inter", "rounded"],
  "terracotta-arch": ["directory-band", "sand-clay", "fraunces-public", "circle"],
  harbor: ["rail-band", "sand-petrol", "lexend-source", "circle"],
  moonlit: ["digital-card", "forest-mint", "jakarta", "circle"],
  peony: ["tabs-card", "lavender-indigo", "nunito", "circle"],
  "studio-mono": ["directory-card", "grey-navy", "jakarta", "circle"],
  saffron: ["directory-band", "sand-clay", "fraunces-public", "circle"],
  daybreak: ["rail-card", "sky-green", "jakarta", "rounded"],
};

/**
 * A stored template and style as the page should use them. A layout id stays as it is. An older whole-template id becomes
 * its layout, with that template's colours, typeface and photo shape filled in underneath whatever the style already says.
 * Anything unknown is no template, which is the original design.
 */
export function normalizeSelection(stored: string | null | undefined, style: ProfileStyle | undefined): { template: LayoutId | undefined; style: ProfileStyle | undefined } {
  if (isLayoutId(stored)) return { template: stored, style };
  const preset = stored ? PRESETS[stored] : undefined;
  if (!preset) return { template: undefined, style: undefined };
  const [layout, scheme, font, shape] = preset;
  return { template: layout, style: { scheme, font, shape, ...style } };
}

// ---- Putting a layout and a practitioner's choices together ----

export interface ResolvedDesign {
  spec: LayoutSpec;
  palette: Palette;
  font: FontPair;
  shape: PhotoShape;
  hidden: Set<SectionKey>;
  /** CSS variables for the page root. */
  vars: Record<string, string>;
}

export function resolvePalette(base: Palette, accentOverride?: string): Palette {
  if (!accentOverride) return base;
  // The tint follows the chosen accent, so a recoloured page stays one family instead of keeping a clashing panel.
  return { ...base, accent: accentOverride, alt: mix(accentOverride, base.bg, base.dark ? 0.3 : 0.14) };
}

export function resolveDesign(id: LayoutId, style?: ProfileStyle): ResolvedDesign {
  const spec = getLayout(id);
  const scheme = getScheme(style?.scheme ?? DEFAULT_SCHEME);
  const palette = resolvePalette(scheme.palette, style?.accent);
  const font = getFontPair(style?.font ?? DEFAULT_FONT);
  const shape = style?.shape ?? DEFAULT_SHAPE;
  const { bg, surface, ink, accent, alt } = palette;
  const border = mix(ink, bg, palette.dark ? 0.18 : 0.12);
  const accentOn = readableOn(accent);
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
    "--pt-accent-text": contrast(accent, bg) >= 4.5 ? accent : readableOn(bg, accent, ink),
    "--pt-alt": alt,
    "--pt-alt-foreground": altOn,
    "--pt-tone": tone,
    "--pt-tone-foreground": toneOn,
    "--pt-tone-muted": mix(toneOn, tone, 0.72),
    "--pt-tone-border": mix(toneOn, tone, 0.24),
    "--pt-tint": mix(accent, bg, 0.1),
    "--pt-tint-strong": mix(accent, bg, 0.2),
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
    "--pt-page": spec.wash ? `linear-gradient(180deg, ${alt} 0, ${bg} 38rem)` : bg,
  };

  return { spec, palette, font, shape, hidden: new Set(style?.hidden ?? []), vars };
}
