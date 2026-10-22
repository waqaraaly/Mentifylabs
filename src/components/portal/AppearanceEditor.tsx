"use client";

import { useState, type ReactNode } from "react";
import { Check, ExternalLink } from "lucide-react";
import {
  DEFAULT_FONT,
  DEFAULT_SHAPE,
  ORIGINAL_SHAPE,
  PHOTO_SHAPES,
  SCHEMES,
  LAYOUTS,
  HEADING_FACES,
  TEXT_FACES,
  getFace,
  nearestScheme,
  pairFaces,
  getScheme,
  resolvePalette,
  CUSTOM_BASE,
  type ColorChoices,
  type ColorMode,
  type FaceId,
  type LayoutId,
  type PhotoShape,
  type ProfileStyle,
  type SchemeId,
} from "@/lib/templates";
import { DEFAULT_COLOR_THEME, type ColorThemeId } from "@/lib/themes";
import { SHAPE_STYLE } from "@/components/practitioner/templates/parts";
import { TEMPLATE_FONT_CLASSES } from "@/components/practitioner/templates/fonts";
import { mix } from "@/lib/color";
import { ColorDialog } from "@/components/portal/ColorDialog";
import { ColorRow } from "@/components/portal/ColorRow";
import { FontSelect } from "@/components/portal/FontSelect";
import {
  CustomPaletteCard,
  PaletteDots,
} from "@/components/portal/PaletteDots";
import { LivePagePreview } from "@/components/portal/LivePagePreview";
import { TemplateThumb } from "@/components/portal/TemplateThumb";

const COLOR_FIELDS: [keyof ColorChoices, string][] = [
  ["page", "colorPage"],
  ["panels", "colorPanels"],
  ["text", "colorText"],
  ["accent", "colorAccent"],
  ["frame", "colorFrame"],
  ["ring", "colorRing"],
  ["underline", "colorUnderline"],
  ["hi", "colorHi"],
];

/** The layout a colour list is for: the original design is Layout 1, which has no layout id. */
type Where = "original" | LayoutId;

/**
 * The parts of the page whose colour a person can set. A part with `on` is shown only on those layouts, in the group
 * of colours for that layout alone; the rest are shown on every layout. A colour hidden on one layout stays saved.
 */
const COLOR_PARTS_UI: {
  id: keyof ColorChoices;
  label: string;
  hint: string;
  /** Which colour of the scheme this part starts as. */
  scheme: "bg" | "alt" | "ink" | "accent";
  on?: Where[];
}[] = [
  {
    id: "page",
    label: "Page background",
    hint: "Behind everything.",
    scheme: "bg",
  },
  {
    id: "text",
    label: "Text",
    hint: "Headings and paragraphs.",
    scheme: "ink",
  },
  {
    id: "accent",
    label: "Buttons and markers",
    hint: "The booking button, links and small marks.",
    scheme: "accent",
  },
  {
    id: "hi",
    label: "Highlight",
    hint: "The soft tint behind badges and tags.",
    scheme: "accent",
    on: ["rail-card"],
  },
  {
    id: "frame",
    label: "Outer frame",
    hint: "The border around the whole page.",
    scheme: "alt",
    on: ["original"],
  },
  {
    id: "ring",
    label: "Photo ring",
    hint: "The ring around your photo. Follows the frame until you set it.",
    scheme: "alt",
    on: ["original"],
  },
  {
    id: "underline",
    label: "Heading underline",
    hint: "The highlight behind each section heading.",
    scheme: "alt",
    on: ["original"],
  },
  {
    id: "panels",
    label: "Soft panels",
    hint: "The soft colour that fades in behind the top of the page.",
    scheme: "alt",
    on: ["rail-card"],
  },
];

const ORIGINAL_HEADING: FaceId = "inter";
const ORIGINAL_TEXT: FaceId = "inter";

/**
 * Appearance as one page of independent choices: Layout, Colours, and Font. Every layout card is drawn in the colours and typeface you have chosen, so they all look
 * alike except for their structure. Everything travels with the profile form in hidden fields (template, scheme,
 * font, shape, hide), because the form is reset after a save and native inputs would snap back to what the page first
 * loaded with. A profile saved before layouts existed keeps its page until a layout is chosen.
 */
export function AppearanceEditor({
  slug,
  template,
  style,
  colorTheme,
}: {
  slug: string;
  template?: LayoutId;
  style?: ProfileStyle;
  colorTheme?: ColorThemeId;
}) {
  // Colours and fonts are one choice shared by every layout, so switching layouts never changes the dropdowns. A profile
  // that has no layout yet starts on the scheme closest to the colour theme it has, and on the fonts it is built with.
  const [layout, setLayout] = useState<LayoutId | undefined>(template);
  const [scheme, setScheme] = useState<SchemeId>(
    style?.scheme ?? nearestScheme(colorTheme),
  );
  const savedPair = style?.font ? pairFaces(style.font) : undefined;
  const [heading, setHeading] = useState<FaceId>(
    style?.headingFont ??
      savedPair?.heading ??
      (template ? pairFaces(DEFAULT_FONT).heading : ORIGINAL_HEADING),
  );
  const [text, setText] = useState<FaceId>(
    style?.textFont ??
      savedPair?.text ??
      (template ? pairFaces(DEFAULT_FONT).text : ORIGINAL_TEXT),
  );
  /** Colours picked for single parts of the page; none means the scheme's. */
  const [colors, setColors] = useState<ColorChoices>(style?.colors ?? {});
  /** Which way of colouring the page is in use. The two are independent: each keeps its own choices while the other is in use. */
  const [colorMode, setColorMode] = useState<ColorMode>(
    style?.colorMode ??
      (Object.values(style?.colors ?? {}).some(Boolean) ? "custom" : "scheme"),
  );
  /** The pop-up where their own colours are set. */
  const [colorsOpen, setColorsOpen] = useState(false);
  const customCount = Object.values(colors).filter(Boolean).length;
  const [shape, setShape] = useState<PhotoShape>(
    style?.shape ?? (template ? DEFAULT_SHAPE : ORIGINAL_SHAPE),
  );

  const schemeDef = getScheme(scheme);
  /** The person's own colours start from this, whatever ready-made scheme is picked. */
  const customBase = CUSTOM_BASE;
  /** What their own colours come to so far; the frame and ring start from these. */
  const resolved = resolvePalette(customBase, colors);
  const startColor = (part: (typeof COLOR_PARTS_UI)[number]) =>
    part.id === "ring"
      ? (colors.frame ?? resolved.alt)
      : part.id === "frame"
        ? resolved.alt
        : part.id === "underline"
          ? mix(resolved.accent, resolved.bg, resolved.dark ? 0.35 : 0.25)
          : part.id === "hi"
            ? mix(resolved.accent, resolved.bg, 0.2)
            : customBase[part.scheme];
  const layoutNumber = layout
    ? LAYOUTS.findIndex((l) => l.id === layout) + 2
    : 0;
  // The colours this layout can set: the ones every layout has, then the ones only it has.
  const here: Where = layout ?? "original";
  const shownParts = COLOR_PARTS_UI.filter((x) => !x.on || x.on.includes(here));
  const coreParts = shownParts.filter((x) => !x.on);
  const extraParts = shownParts.filter((x) => x.on);
  const colorRow = (part: (typeof COLOR_PARTS_UI)[number]) => (
    <ColorRow
      key={part.id}
      label={part.label}
      hint={part.hint}
      startColor={startColor(part)}
      value={colors[part.id]}
      onChange={(hex) =>
        setColors((c) => {
          const next = { ...c };
          if (hex) next[part.id] = hex;
          else delete next[part.id];
          return next;
        })
      }
    />
  );

  const pageUrl = (id: LayoutId | undefined, embed = false) => {
    const q = new URLSearchParams({
      template: id ?? "",
      headingFont: heading,
      textFont: text,
    });
    q.set("scheme", scheme);
    q.set("colorMode", colorMode);
    for (const [part, name] of COLOR_FIELDS) {
      const value = colors[part];
      if (value) q.set(name, value);
    }
    q.set("shape", shape);
    if (embed) q.set("embed", "1");
    return `/preview/${slug}?${q.toString()}`;
  };

  const previewHref = pageUrl(layout);

  return (
    <div className={`${TEMPLATE_FONT_CLASSES} py-6`}>
      <input type="hidden" name="template" value={layout ?? ""} />
      {/* The original design's own colour theme is kept as it was; only choosing a scheme replaces it. */}
      <input
        type="hidden"
        name="colorTheme"
        value={colorTheme ?? DEFAULT_COLOR_THEME}
      />
      <input type="hidden" name="headingFont" value={heading} />
      <input type="hidden" name="textFont" value={text} />
      <input type="hidden" name="shape" value={shape} />
      <input type="hidden" name="scheme" value={scheme} />
      <input type="hidden" name="colorMode" value={colorMode} />
      {COLOR_FIELDS.map(([part, name]) =>
        colors[part] ? (
          <input key={name} type="hidden" name={name} value={colors[part]} />
        ) : null,
      )}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {/* Preview, on the right, always in the current colours and typeface */}
        <div className="lg:order-2 lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-xl shadow-[0_18px_40px_-22px_rgba(0,0,0,0.45)] ring-1 ring-black/10">
            <LivePagePreview src={pageUrl(layout, true)} />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <SummaryRow label="Layout">
              {layout ? `Layout ${layoutNumber}` : "Layout 1"}
            </SummaryRow>
            <SummaryRow label="Colours">
              <span className="truncate">
                {colorMode === "custom" ? "Your own" : schemeDef.name}
              </span>
            </SummaryRow>
            <SummaryRow label="Headings">
              <span
                className="truncate"
                style={{ fontFamily: `var(${getFace(heading).var})` }}
              >
                {getFace(heading).name}
              </span>
            </SummaryRow>
            <SummaryRow label="Text">
              <span
                className="truncate"
                style={{ fontFamily: `var(${getFace(text).var})` }}
              >
                {getFace(text).name}
              </span>
            </SummaryRow>
          </dl>
          <a
            href={previewHref}
            target="_blank"
            rel="noopener"
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ring-1 ring-black/[0.14] transition hover:bg-black/[0.04]"
          >
            <ExternalLink className="size-4" aria-hidden />
            Preview with my details
          </a>
        </div>

        <div className="min-w-0 space-y-12 lg:order-1">
          <section>
            <Heading
              title="Choose a layout"
              hint="How each page is organised. Your colour and font choices show in the preview on the right."
            />
            <div
              role="radiogroup"
              aria-label="Layout"
              id="template"
              className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-3"
            >
              <button
                type="button"
                role="radio"
                aria-checked={!layout}
                onClick={() => setLayout(undefined)}
                className="group cursor-pointer text-left outline-none"
              >
                <span
                  className={`relative block overflow-hidden rounded-xl transition duration-200 group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-primary ${!layout ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-black/[0.1] group-hover:shadow-md"}`}
                >
                  <TemplateThumb id="original" />
                  {!layout && (
                    <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                      <Check className="size-3.5" strokeWidth={3} aria-hidden />
                    </span>
                  )}
                </span>
                <span className="mt-2.5 block text-sm font-semibold">
                  Layout 1
                </span>
              </button>
              {LAYOUTS.map((l, i) => {
                const on = layout === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setLayout(l.id)}
                    className="group cursor-pointer text-left outline-none"
                  >
                    <span
                      className={`relative block overflow-hidden rounded-xl transition duration-200 group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-primary ${on ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-black/[0.1] group-hover:shadow-md"}`}
                    >
                      <TemplateThumb id={l.id} />
                      {on && (
                        <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                          <Check
                            className="size-3.5"
                            strokeWidth={3}
                            aria-hidden
                          />
                        </span>
                      )}
                    </span>
                    <span className="mt-2.5 block text-sm font-semibold">
                      Layout {i + 2}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <Heading
              title="Colours"
              hint="Choose a ready-made scheme, or set your own."
            />
            <div className="space-y-6">
              <PaletteDots
                label="Colours"
                items={SCHEMES.filter((x) => !x.retired || x.id === scheme).map(
                  (x) => ({
                    id: x.id,
                    name: x.name,
                    colors: [
                      x.palette.bg,
                      x.palette.alt,
                      x.palette.accent,
                      x.palette.ink,
                    ],
                  }),
                )}
                selected={colorMode === "scheme" ? scheme : undefined}
                onSelect={(id) => {
                  setScheme(id as SchemeId);
                  setColorMode("scheme");
                }}
                leading={
                  <CustomPaletteCard
                    colors={
                      Object.values(colors).some(Boolean)
                        ? [
                            resolved.bg,
                            resolved.alt,
                            resolved.accent,
                            resolved.ink,
                          ]
                        : null
                    }
                    on={colorMode === "custom"}
                    onClick={() => {
                      setColorMode("custom");
                      setColorsOpen(true);
                    }}
                  />
                }
              />

              {colorMode === "custom" && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-surface px-5 py-4">
                  <div className="flex shrink-0 -space-x-1.5">
                    {[
                      resolved.bg,
                      resolved.alt,
                      resolved.accent,
                      resolved.ink,
                    ].map((c, i) => (
                      <span
                        key={i}
                        aria-hidden
                        className="size-7 rounded-full ring-2 ring-surface"
                        style={{
                          background: c,
                          boxShadow: "inset 0 0 0 1px rgb(0 0 0 / 0.14)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-medium">Your own colours</p>
                    <p className="text-sm text-muted">
                      {customCount > 0
                        ? `${customCount} ${customCount === 1 ? "colour" : "colours"} set by you`
                        : "Starting from plain neutrals"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setColorsOpen(true)}
                    className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:bg-black/5"
                  >
                    Edit colours
                  </button>
                </div>
              )}

              <ColorDialog
                open={colorsOpen}
                onClose={() => setColorsOpen(false)}
                title="Your own colours"
                hint="Enter a colour code (like #1F6F5C) or a colour name (like teal), or click a swatch to pick one."
                canReset={shownParts.some((x) => colors[x.id])}
                onReset={() =>
                  setColors((c) => {
                    const next = { ...c };
                    for (const x of shownParts) delete next[x.id];
                    return next;
                  })
                }
              >
                <div className="space-y-6">
                  <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                    {coreParts.map(colorRow)}
                  </div>
                  {extraParts.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                        Only on Layout {layout ? layoutNumber : 1}
                      </p>
                      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                        {extraParts.map(colorRow)}
                      </div>
                    </div>
                  )}
                </div>
              </ColorDialog>
            </div>
          </section>

          <section>
            <Heading
              title="Fonts"
              hint="The lettering used across your page."
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h4 className="mb-3 text-sm font-semibold">Heading</h4>
                <FontSelect
                  label="Heading font"
                  value={heading}
                  options={[
                    ...HEADING_FACES.map((f) => ({
                      id: f.id,
                      name: f.name,
                      family: `var(${f.var})`,
                      weight: f.heading!.weight,
                    })),
                  ]}
                  onChange={(id) => setHeading(id as FaceId)}
                />
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold">Text</h4>
                <FontSelect
                  label="Text font"
                  value={text}
                  options={[
                    ...TEXT_FACES.map((f) => ({
                      id: f.id,
                      name: f.name,
                      family: `var(${f.var})`,
                    })),
                  ]}
                  onChange={(id) => setText(id as FaceId)}
                />
              </div>
            </div>
          </section>

          <section>
            <Heading title="Photo shape" hint="How your photo is cropped." />
            <div
              role="radiogroup"
              aria-label="Photo shape"
              className="flex flex-wrap gap-2.5"
            >
              {PHOTO_SHAPES.map((x) => {
                const on = shape === x.id;
                const geometry = SHAPE_STYLE[x.id];
                return (
                  <button
                    key={x.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setShape(x.id)}
                    className={`flex w-[4.8rem] cursor-pointer flex-col items-center gap-2 rounded-xl bg-surface px-2 py-3 text-xs transition ${on ? "ring-2 ring-primary" : "ring-1 ring-black/[0.08] hover:ring-black/20"}`}
                  >
                    <span
                      aria-hidden
                      className="block w-8 bg-foreground/70"
                      style={{
                        aspectRatio: geometry.aspect,
                        borderRadius: geometry.radius,
                      }}
                    />
                    {x.name}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Heading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-0.5 text-sm text-muted">{hint}</p>
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-xs text-muted">{label}</dt>
      <dd className="flex min-w-0 items-center justify-end gap-2 text-right font-medium">
        {children}
      </dd>
    </div>
  );
}
