"use client";

import { useState } from "react";
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
  type ColorChoices,
  type FaceId,
  type LayoutId,
  type PhotoShape,
  type ProfileStyle,
  type SchemeId,
} from "@/lib/templates";
import { DEFAULT_COLOR_THEME, type ColorThemeId } from "@/lib/themes";
import { SHAPE_STYLE } from "@/components/practitioner/templates/parts";
import { TEMPLATE_FONT_CLASSES } from "@/components/practitioner/templates/fonts";
import { ColorRow, type ColorOption } from "@/components/portal/ColorRow";
import { FontSelect } from "@/components/portal/FontSelect";
import { PaletteDots } from "@/components/portal/PaletteDots";
import { LivePagePreview } from "@/components/portal/LivePagePreview";
import { TemplateThumb } from "@/components/portal/TemplateThumb";

const COLOR_FIELDS: [keyof ColorChoices, string][] = [
  ["page", "colorPage"],
  ["panels", "colorPanels"],
  ["text", "colorText"],
  ["accent", "colorAccent"],
];

/** The parts of the page whose colour can be set, and some good colours to start from for each. */
const COLOR_PARTS_UI: {
  id: keyof ColorChoices;
  label: string;
  hint: string;
  /** Which colour of the scheme this part starts as. */
  scheme: "bg" | "alt" | "ink" | "accent";
  options: ColorOption[];
}[] = [
  {
    id: "page",
    label: "Page background",
    hint: "Behind everything.",
    scheme: "bg",
    options: [
      { name: "White", hex: "#ffffff" },
      { name: "Cool grey", hex: "#eef2f7" },
      { name: "Pale sky", hex: "#eaf2fa" },
      { name: "Mint", hex: "#eff5f1" },
      { name: "Cream", hex: "#f6f5ec" },
      { name: "Warm paper", hex: "#f6efe6" },
      { name: "Lavender", hex: "#f4f2f9" },
      { name: "Navy", hex: "#0e1a2b" },
      { name: "Forest", hex: "#0f211b" },
      { name: "Charcoal", hex: "#1c1917" },
    ],
  },
  {
    id: "panels",
    label: "Panels and tiles",
    hint: "Cards, tags and soft highlights.",
    scheme: "alt",
    options: [
      { name: "Aqua", hex: "#e3f3f4" },
      { name: "Sky", hex: "#dce7f3" },
      { name: "Sage", hex: "#e8f0ea" },
      { name: "Olive", hex: "#e6ebd3" },
      { name: "Sand", hex: "#efe0ce" },
      { name: "Stone", hex: "#e6dfd3" },
      { name: "Lilac", hex: "#e4dff3" },
      { name: "Blush", hex: "#f1e7f0" },
    ],
  },
  {
    id: "text",
    label: "Text",
    hint: "Headings and paragraphs.",
    scheme: "ink",
    options: [
      { name: "Deep teal", hex: "#14303a" },
      { name: "Navy", hex: "#12263d" },
      { name: "Forest", hex: "#1f2d26" },
      { name: "Plum", hex: "#231c2a" },
      { name: "Brown", hex: "#33261e" },
      { name: "Charcoal", hex: "#1c1917" },
      { name: "White", hex: "#f5f7f8" },
    ],
  },
  {
    id: "accent",
    label: "Buttons and highlights",
    hint: "The booking button, links and small marks.",
    scheme: "accent",
    options: [
      { name: "Teal", hex: "#0b7285" },
      { name: "Sea green", hex: "#1e8456" },
      { name: "Sage", hex: "#4a7a5c" },
      { name: "Olive", hex: "#66742f" },
      { name: "Sky blue", hex: "#2b6fa8" },
      { name: "Navy", hex: "#1f3f6e" },
      { name: "Indigo", hex: "#4b4c9e" },
      { name: "Plum", hex: "#6b2f5e" },
      { name: "Rose", hex: "#a8456b" },
      { name: "Clay", hex: "#b5543a" },
      { name: "Walnut", hex: "#7a5436" },
      { name: "Slate", hex: "#34495a" },
    ],
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
  const [shape, setShape] = useState<PhotoShape>(
    style?.shape ?? (template ? DEFAULT_SHAPE : ORIGINAL_SHAPE),
  );

  const schemeDef = getScheme(scheme);
  const layoutNumber = layout
    ? LAYOUTS.findIndex((l) => l.id === layout) + 2
    : 0;

  const pageUrl = (id: LayoutId | undefined, embed = false) => {
    const q = new URLSearchParams({
      template: id ?? "",
      headingFont: heading,
      textFont: text,
    });
    q.set("scheme", scheme);
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
            <Summary
              label="Layout"
              value={layout ? `Layout ${layoutNumber}` : "Layout 1"}
            />
            <Summary label="Colours" value={schemeDef.name} />
            <Summary label="Heading font" value={getFace(heading).name} />
            <Summary label="Text font" value={getFace(text).name} />
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
              hint="Start from a scheme, then change the colour of any part of the page."
            />
            <div className="space-y-8">
              <div>
                <h4 className="mb-3 text-sm font-semibold">Colour scheme</h4>
                <PaletteDots
                  label="Colour scheme"
                  items={SCHEMES.map((x) => ({
                    id: x.id,
                    name: x.name,
                    colors: [x.palette.bg, x.palette.alt, x.palette.accent],
                  }))}
                  selected={scheme}
                  onSelect={(id) => {
                    setScheme(id as SchemeId);
                    setColors({});
                  }}
                />
              </div>
              {COLOR_PARTS_UI.map((part) => (
                <ColorRow
                  key={part.id}
                  label={part.label}
                  hint={part.hint}
                  options={part.options}
                  schemeColor={schemeDef.palette[part.scheme]}
                  value={colors[part.id]}
                  onChange={(hex) => setColors({ ...colors, [part.id]: hex })}
                />
              ))}
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

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
