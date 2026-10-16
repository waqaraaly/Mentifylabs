import { HEX, contrast, darken, mix, readableOn } from "@/lib/color";

/**
 * Profile templates. A template is a recipe, not a stylesheet: which hero composition and page structure to use, the
 * palette, the type pairing, the photo shape and how each section is drawn. Twenty of them share a small set of
 * building blocks (see components/practitioner/templates), and a practitioner can then change the accent colour, the
 * typeface, the photo shape and which sections show without leaving the template. Those changes are stored as a
 * ProfileStyle next to the template id, so a template can be improved later without losing anyone's choices.
 */

export type HeroKind = "split" | "center" | "band" | "masthead" | "poster" | "card";
export type BodyKind = "flow" | "rail" | "bento" | "story";
export type PhotoShape = "circle" | "arch" | "rounded" | "blob" | "square" | "oval";
export type ExpertiseStyle = "chips" | "rules" | "tiles" | "cloud" | "numbered";
export type ServicesStyle = "list" | "cards" | "numbered" | "rows";
export type JourneyStyle = "rail" | "rows" | "cards";
export type HeadingStyle = "plain" | "eyebrow" | "numbered" | "underline" | "script";
export type Deco = "none" | "grain" | "dots" | "lines";
export type SectionKey = "stats" | "expertise" | "services" | "journey";
export type TemplateGroup = "Soft and warm" | "Calm and cool" | "Bold and bright" | "Quiet and minimal" | "Dark";

export interface Palette {
  bg: string;
  /** Cards and panels that sit on the page. */
  surface: string;
  ink: string;
  accent: string;
  /** The second colour: hero panels, bands and decoration. */
  alt: string;
  dark?: boolean;
}

export type FontPairId =
  | "fraunces-dm"
  | "instrument-inter"
  | "dmserif-dmsans"
  | "cormorant-figtree"
  | "young-dm"
  | "newsreader-lora"
  | "playfair-manrope"
  | "space-inter"
  | "bricolage-figtree"
  | "syne-manrope"
  | "inter-plain"
  | "bodoni-dm";

export interface FontPair {
  id: FontPairId;
  name: string;
  note: string;
  /** CSS variables set by next/font (see components/practitioner/templates/fonts.ts). */
  display: string;
  body: string;
  weight: number;
  tracking: string;
  /** Some faces set small for their size; this evens the headings out. */
  scale: number;
}

export const FONT_PAIRS: FontPair[] = [
  { id: "fraunces-dm", name: "Warm serif", note: "Fraunces and DM Sans", display: "--font-fraunces", body: "--f-dmsans", weight: 500, tracking: "-0.02em", scale: 1 },
  { id: "instrument-inter", name: "Editorial", note: "Instrument Serif and Inter", display: "--f-instrument", body: "--font-inter", weight: 400, tracking: "-0.015em", scale: 1.12 },
  { id: "dmserif-dmsans", name: "Friendly classic", note: "DM Serif Display and DM Sans", display: "--f-dmserif", body: "--f-dmsans", weight: 400, tracking: "-0.01em", scale: 1 },
  { id: "cormorant-figtree", name: "Refined", note: "Cormorant and Figtree", display: "--f-cormorant", body: "--f-figtree", weight: 600, tracking: "-0.01em", scale: 1.16 },
  { id: "young-dm", name: "Gentle", note: "Young Serif and DM Sans", display: "--f-young", body: "--f-dmsans", weight: 400, tracking: "-0.01em", scale: 0.96 },
  { id: "newsreader-lora", name: "Literary", note: "Newsreader and Lora", display: "--f-newsreader", body: "--f-lora", weight: 500, tracking: "-0.015em", scale: 1.04 },
  { id: "playfair-manrope", name: "Elegant", note: "Playfair Display and Manrope", display: "--f-playfair", body: "--f-manrope", weight: 500, tracking: "-0.015em", scale: 0.98 },
  { id: "space-inter", name: "Modern", note: "Space Grotesk and Inter", display: "--f-space", body: "--font-inter", weight: 600, tracking: "-0.035em", scale: 0.94 },
  { id: "bricolage-figtree", name: "Friendly modern", note: "Bricolage Grotesque and Figtree", display: "--f-bricolage", body: "--f-figtree", weight: 700, tracking: "-0.03em", scale: 0.96 },
  { id: "syne-manrope", name: "Studio", note: "Syne and Manrope", display: "--f-syne", body: "--f-manrope", weight: 700, tracking: "-0.02em", scale: 0.88 },
  { id: "inter-plain", name: "Plain and clear", note: "Inter throughout", display: "--font-inter", body: "--font-inter", weight: 500, tracking: "-0.04em", scale: 0.94 },
  { id: "bodoni-dm", name: "Fashion", note: "Bodoni Moda and DM Sans", display: "--f-bodoni", body: "--f-dmsans", weight: 500, tracking: "-0.02em", scale: 1 },
];

export const FONT_PAIR_IDS = FONT_PAIRS.map((f) => f.id);
export const getFontPair = (id: FontPairId): FontPair => FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0];

export const PHOTO_SHAPES: { id: PhotoShape; name: string }[] = [
  { id: "circle", name: "Circle" },
  { id: "arch", name: "Arch" },
  { id: "rounded", name: "Rounded" },
  { id: "oval", name: "Oval" },
  { id: "blob", name: "Soft blob" },
  { id: "square", name: "Square" },
];

/** Accent colours offered on top of each template's own. The practitioner can also pick any colour. */
export const ACCENT_PRESETS: { name: string; hex: string }[] = [
  { name: "Terracotta", hex: "#B8573A" },
  { name: "Rose", hex: "#B24A66" },
  { name: "Raspberry", hex: "#A12B57" },
  { name: "Marigold", hex: "#C98512" },
  { name: "Olive", hex: "#66742F" },
  { name: "Moss", hex: "#3F6B4D" },
  { name: "Teal", hex: "#1F7A74" },
  { name: "Sea blue", hex: "#2B6F9E" },
  { name: "Denim", hex: "#3F5F8A" },
  { name: "Navy", hex: "#21365E" },
  { name: "Plum", hex: "#6A3C63" },
  { name: "Charcoal", hex: "#2A2723" },
];

export const SECTION_LABELS: Record<SectionKey, string> = {
  stats: "Experience, fee and session mode",
  expertise: "Areas of expertise",
  services: "Services offered",
  journey: "Education and experience",
};
export const SECTION_KEYS = Object.keys(SECTION_LABELS) as SectionKey[];

export interface TemplateSpec {
  id: string;
  name: string;
  /** One line on how it feels, shown in the picker. */
  mood: string;
  group: TemplateGroup;
  hero: HeroKind;
  /** Mirrors the hero (photo on the other side). */
  flip?: boolean;
  body: BodyKind;
  palette: Palette;
  font: FontPairId;
  shape: PhotoShape;
  expertise: ExpertiseStyle;
  services: ServicesStyle;
  journey: JourneyStyle;
  heading: HeadingStyle;
  deco: Deco;
  /** Corner radius of cards and panels, in px. */
  radius: number;
  /** Small labels set in a monospace face. */
  mono?: boolean;
  /** Extra decoration drawn behind the hero. */
  ornament?: "geometric";
}

export const TEMPLATES = [
  {
    id: "linen",
    name: "Linen",
    mood: "Oat paper, denim blue and a photo in soft corners. Easy and trustworthy.",
    group: "Soft and warm",
    hero: "split",
    body: "flow",
    palette: { bg: "#F4EEE3", surface: "#FBF8F2", ink: "#2B2A27", accent: "#3F5F8A", alt: "#E4DAC6" },
    font: "fraunces-dm",
    shape: "rounded",
    expertise: "chips",
    services: "list",
    journey: "rail",
    heading: "eyebrow",
    deco: "grain",
    radius: 22,
  },
  {
    id: "atelier",
    name: "Atelier",
    mood: "A magazine cover in black ink with one red full stop. Confident and literary.",
    group: "Quiet and minimal",
    hero: "masthead",
    body: "story",
    palette: { bg: "#F4F1EA", surface: "#FFFFFF", ink: "#151515", accent: "#D43F1F", alt: "#E4DFD2" },
    font: "instrument-inter",
    shape: "square",
    expertise: "rules",
    services: "numbered",
    journey: "rows",
    heading: "plain",
    deco: "none",
    radius: 2,
  },
  {
    id: "tidepool",
    name: "Tidepool",
    mood: "Sea-glass green, a round portrait and dotted paper. Calm from the first glance.",
    group: "Calm and cool",
    hero: "center",
    body: "flow",
    palette: { bg: "#EAF3F0", surface: "#FFFFFF", ink: "#12302D", accent: "#1F7A74", alt: "#C7E3DC" },
    font: "dmserif-dmsans",
    shape: "circle",
    expertise: "tiles",
    services: "cards",
    journey: "cards",
    heading: "underline",
    deco: "dots",
    radius: 24,
  },
  {
    id: "midnight-study",
    name: "Midnight Study",
    mood: "Ink-blue evening, brass details and a quiet serif. Private and reassuring.",
    group: "Dark",
    hero: "split",
    flip: true,
    body: "rail",
    palette: { bg: "#111A2C", surface: "#1A2641", ink: "#F0EBDF", accent: "#E0B25B", alt: "#2A3858", dark: true },
    font: "cormorant-figtree",
    shape: "oval",
    expertise: "cloud",
    services: "rows",
    journey: "rail",
    heading: "eyebrow",
    deco: "none",
    radius: 14,
  },
  {
    id: "citrine",
    name: "Citrine",
    mood: "Butter yellow, black type and a full-bleed photo. Friendly, loud in a good way.",
    group: "Bold and bright",
    hero: "poster",
    body: "bento",
    palette: { bg: "#FAEAA5", surface: "#FFF7D8", ink: "#1B1912", accent: "#1B1912", alt: "#F2C240" },
    font: "bricolage-figtree",
    shape: "square",
    expertise: "chips",
    services: "cards",
    journey: "cards",
    heading: "plain",
    deco: "none",
    radius: 20,
  },
  {
    id: "orchard",
    name: "Orchard",
    mood: "Sage band, a round portrait stepping over its edge and a gentle serif.",
    group: "Soft and warm",
    hero: "band",
    body: "flow",
    palette: { bg: "#F5F2E8", surface: "#FFFFFF", ink: "#26301F", accent: "#4F6B3C", alt: "#BDD2A3" },
    font: "young-dm",
    shape: "circle",
    expertise: "chips",
    services: "cards",
    journey: "rail",
    heading: "underline",
    deco: "none",
    radius: 28,
  },
  {
    id: "paperback",
    name: "Paperback",
    mood: "A title page. Cream stock, oxblood ink and a serif made for reading.",
    group: "Soft and warm",
    hero: "center",
    body: "flow",
    palette: { bg: "#F2EAD8", surface: "#F8F2E4", ink: "#3A2A1E", accent: "#8A3B2A", alt: "#E3D5B8" },
    font: "newsreader-lora",
    shape: "oval",
    expertise: "cloud",
    services: "numbered",
    journey: "rows",
    heading: "plain",
    deco: "grain",
    radius: 4,
  },
  {
    id: "dusk",
    name: "Dusk",
    mood: "Clay pink, plum ink and a card that floats above it. Warm without being sweet.",
    group: "Soft and warm",
    hero: "card",
    body: "bento",
    palette: { bg: "#F5E8E3", surface: "#FFF9F6", ink: "#3E2530", accent: "#A94662", alt: "#E8C7C2" },
    font: "playfair-manrope",
    shape: "rounded",
    expertise: "chips",
    services: "list",
    journey: "cards",
    heading: "eyebrow",
    deco: "none",
    radius: 26,
  },
  {
    id: "slate-and-sun",
    name: "Slate and Sun",
    mood: "Cool grey-blue with one spark of orange and a photo on an offset block.",
    group: "Calm and cool",
    hero: "split",
    body: "bento",
    palette: { bg: "#E8EDF1", surface: "#FFFFFF", ink: "#1E2A36", accent: "#DE6E24", alt: "#C5D3DE" },
    font: "space-inter",
    shape: "square",
    expertise: "numbered",
    services: "rows",
    journey: "rows",
    heading: "numbered",
    deco: "none",
    radius: 8,
    mono: true,
  },
  {
    id: "cedar",
    name: "Cedar",
    mood: "Dark walnut panel against oat paper. Grounded, premium, unhurried.",
    group: "Soft and warm",
    hero: "poster",
    flip: true,
    body: "story",
    palette: { bg: "#EFE6D8", surface: "#F8F1E5", ink: "#2E211A", accent: "#7A4A2B", alt: "#3A2A22" },
    font: "cormorant-figtree",
    shape: "square",
    expertise: "rules",
    services: "rows",
    journey: "rail",
    heading: "plain",
    deco: "grain",
    radius: 6,
  },
  {
    id: "meadow-notes",
    name: "Meadow Notes",
    mood: "Fresh greens, a handwritten touch and a soft-edged portrait. Light and human.",
    group: "Calm and cool",
    hero: "center",
    body: "flow",
    palette: { bg: "#F3F7EE", surface: "#FFFFFF", ink: "#26361F", accent: "#5E8C4A", alt: "#DCEBCE" },
    font: "bricolage-figtree",
    shape: "blob",
    expertise: "chips",
    services: "list",
    journey: "rail",
    heading: "script",
    deco: "none",
    radius: 22,
  },
  {
    id: "bauhaus-calm",
    name: "Bauhaus Calm",
    mood: "Circles, squares and a mustard sun on warm paper. Playful, still professional.",
    group: "Bold and bright",
    hero: "card",
    body: "bento",
    palette: { bg: "#F4EEDF", surface: "#FFFDF6", ink: "#1B2A3D", accent: "#C8472B", alt: "#F0B73A" },
    font: "syne-manrope",
    shape: "circle",
    expertise: "tiles",
    services: "cards",
    journey: "cards",
    heading: "plain",
    deco: "none",
    radius: 6,
    ornament: "geometric",
  },
  {
    id: "quiet-hour",
    name: "Quiet Hour",
    mood: "Almost nothing: white space, fine rules and one deep green. For people who say little and mean it.",
    group: "Quiet and minimal",
    hero: "masthead",
    body: "story",
    palette: { bg: "#FBFBF9", surface: "#F2F2EE", ink: "#1A1A1A", accent: "#2F4A3F", alt: "#ECECE6" },
    font: "inter-plain",
    shape: "rounded",
    expertise: "cloud",
    services: "list",
    journey: "rows",
    heading: "plain",
    deco: "none",
    radius: 0,
  },
  {
    id: "terracotta-arch",
    name: "Terracotta Arch",
    mood: "A doorway-shaped portrait in clay and cream. Warm, grounded, a little bohemian.",
    group: "Soft and warm",
    hero: "center",
    body: "flow",
    palette: { bg: "#F6EBDD", surface: "#FBF4EA", ink: "#3B2A20", accent: "#C2603E", alt: "#EACBAA" },
    font: "fraunces-dm",
    shape: "arch",
    expertise: "tiles",
    services: "numbered",
    journey: "rail",
    heading: "eyebrow",
    deco: "none",
    radius: 26,
  },
  {
    id: "harbor",
    name: "Harbor",
    mood: "A deep navy band, white page and a coral signal. Steady, clear, clinical in the best way.",
    group: "Calm and cool",
    hero: "band",
    body: "rail",
    palette: { bg: "#F5F7F8", surface: "#FFFFFF", ink: "#14243A", accent: "#E4583E", alt: "#14304F" },
    font: "newsreader-lora",
    shape: "rounded",
    expertise: "chips",
    services: "rows",
    journey: "cards",
    heading: "underline",
    deco: "none",
    radius: 12,
  },
  {
    id: "moonlit",
    name: "Moonlit",
    mood: "Forest at night with a mint glow. Soothing and a bit unexpected.",
    group: "Dark",
    hero: "card",
    body: "bento",
    palette: { bg: "#11201B", surface: "#1A2D26", ink: "#E9F1EA", accent: "#8FD3A8", alt: "#234236", dark: true },
    font: "bodoni-dm",
    shape: "circle",
    expertise: "chips",
    services: "cards",
    journey: "rail",
    heading: "eyebrow",
    deco: "none",
    radius: 24,
  },
  {
    id: "peony",
    name: "Peony",
    mood: "Blush white, deep raspberry and an oval portrait. Graceful, with a little romance.",
    group: "Soft and warm",
    hero: "split",
    flip: true,
    body: "flow",
    palette: { bg: "#FBF2F2", surface: "#FFFFFF", ink: "#3A1F2B", accent: "#B12A5B", alt: "#F3D5DB" },
    font: "playfair-manrope",
    shape: "oval",
    expertise: "cloud",
    services: "cards",
    journey: "rail",
    heading: "plain",
    deco: "none",
    radius: 30,
  },
  {
    id: "studio-mono",
    name: "Studio Mono",
    mood: "Bone and black with a hot orange mark, set in grids. Design-studio sharp.",
    group: "Quiet and minimal",
    hero: "masthead",
    body: "bento",
    palette: { bg: "#EDEBE4", surface: "#F8F7F2", ink: "#101010", accent: "#F2541B", alt: "#D9D6CB" },
    font: "space-inter",
    shape: "square",
    expertise: "numbered",
    services: "rows",
    journey: "rows",
    heading: "numbered",
    deco: "lines",
    radius: 0,
    mono: true,
  },
  {
    id: "saffron",
    name: "Saffron",
    mood: "Golden panel, burnt orange and a fashion-magazine serif. Warm, rich, memorable.",
    group: "Bold and bright",
    hero: "poster",
    body: "rail",
    palette: { bg: "#FBF1DC", surface: "#FFF9EA", ink: "#3A2312", accent: "#C0561A", alt: "#F0B34C" },
    font: "dmserif-dmsans",
    shape: "square",
    expertise: "chips",
    services: "numbered",
    journey: "rail",
    heading: "underline",
    deco: "none",
    radius: 14,
  },
  {
    id: "daybreak",
    name: "Daybreak",
    mood: "Pale sky, a peach sun and rings of light around a round portrait. Hopeful.",
    group: "Calm and cool",
    hero: "center",
    body: "bento",
    palette: { bg: "#F5F3EF", surface: "#FFFFFF", ink: "#232B3B", accent: "#DD6F52", alt: "#CFE0EC" },
    font: "instrument-inter",
    shape: "circle",
    expertise: "chips",
    services: "cards",
    journey: "rail",
    heading: "eyebrow",
    deco: "none",
    radius: 28,
  },
] as const satisfies readonly TemplateSpec[];

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const TEMPLATE_GROUPS: TemplateGroup[] = ["Soft and warm", "Calm and cool", "Bold and bright", "Quiet and minimal", "Dark"];

export const isTemplateId = (value: unknown): value is TemplateId => TEMPLATES.some((t) => t.id === value);
export const getTemplate = (id: TemplateId): TemplateSpec => TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

// ---- What a practitioner can change ----

export interface ProfileStyle {
  /** Replaces the template's accent colour (#rrggbb). */
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
export function cleanStyle(input: { accent?: unknown; font?: unknown; shape?: unknown; hidden?: unknown } | null | undefined): ProfileStyle | undefined {
  if (!input) return undefined;
  const style: ProfileStyle = {};
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

// ---- Putting a template and a practitioner's changes together ----

export interface ResolvedDesign {
  spec: TemplateSpec;
  palette: Palette;
  font: FontPair;
  shape: PhotoShape;
  hidden: Set<SectionKey>;
  /** CSS variables for the page root. */
  vars: Record<string, string>;
}

export function resolvePalette(base: Palette, accentOverride?: string): Palette {
  if (!accentOverride) return base;
  // The second colour follows the chosen accent, so a recoloured page stays one family instead of keeping a clashing panel.
  return { ...base, accent: accentOverride, alt: mix(accentOverride, base.bg, base.dark ? 0.32 : 0.26) };
}

export function resolveDesign(id: TemplateId, style?: ProfileStyle): ResolvedDesign {
  const spec = getTemplate(id);
  const palette = resolvePalette(spec.palette, style?.accent);
  const font = getFontPair(style?.font ?? spec.font);
  const shape = style?.shape ?? spec.shape;
  const { bg, surface, ink, accent, alt } = palette;
  const border = mix(ink, bg, 0.14);
  const accentOn = readableOn(accent);
  const altOn = contrast(alt, ink) >= contrast(alt, bg) ? ink : bg;

  const vars: Record<string, string> = {
    "--pt-bg": bg,
    "--pt-surface": surface,
    "--pt-text": ink,
    "--pt-tagline": mix(ink, bg, 0.82),
    "--pt-muted": mix(ink, bg, 0.62),
    "--pt-border": border,
    "--pt-accent": accent,
    "--pt-accent-hover": darken(accent, 0.14),
    "--pt-accent-foreground": accentOn,
    "--pt-alt": alt,
    "--pt-alt-foreground": altOn,
    "--pt-tint": mix(accent, bg, 0.13),
    "--pt-tint-strong": mix(accent, bg, 0.24),
    "--pt-outer": alt,
    "--pt-input-bg": mix(ink, bg, 0.05),
    "--pt-input-border": border,
    "--pt-modal-sidebar": accent,
    "--pt-modal-sidebar-fg": accentOn,
    "--pt-r": `${spec.radius}px`,
    "--pt-ds": String(font.scale),
    "--pt-display": `var(${font.display})`,
    "--pt-body": `var(${font.body})`,
    "--pt-display-weight": String(font.weight),
    "--pt-display-tracking": font.tracking,
    "--pt-label": spec.mono ? "var(--font-geist-mono)" : `var(${font.body})`,
  };

  return { spec, palette, font, shape, hidden: new Set(style?.hidden ?? []), vars };
}
