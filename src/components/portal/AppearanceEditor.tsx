"use client";

import { useMemo, useState } from "react";
import { Check, ExternalLink, RotateCcw } from "lucide-react";
import {
  ACCENT_PRESETS,
  DEFAULT_FONT,
  DEFAULT_SCHEME,
  DEFAULT_SHAPE,
  FONT_PAIRS,
  LAYOUTS,
  PHOTO_SHAPES,
  SCHEMES,
  SECTION_KEYS,
  SECTION_LABELS,
  getFontPair,
  getScheme,
  type FontPairId,
  type LayoutId,
  type PhotoShape,
  type ProfileStyle,
  type SchemeId,
  type SectionKey,
} from "@/lib/templates";
import { DEFAULT_COLOR_THEME, type ColorThemeId } from "@/lib/themes";
import { TEMPLATE_FONT_CLASSES } from "@/components/practitioner/templates/fonts";
import { SHAPE_STYLE } from "@/components/practitioner/templates/parts";
import { TemplateThumb } from "@/components/portal/TemplateThumb";
import { ThemePicker } from "@/components/portal/ThemePicker";

type Tab = "layout" | "colours" | "font";

const TABS: { id: Tab; label: string }[] = [
  { id: "layout", label: "Layout" },
  { id: "colours", label: "Colours" },
  { id: "font", label: "Font" },
];

/** The layout a preview shows before one has been chosen. */
const SAMPLE_LAYOUT: LayoutId = "rail-card";

const same = (a?: string, b?: string) => (a ?? "").toLowerCase() === (b ?? "").toLowerCase();

/**
 * Appearance in three tabs that never override each other: Layout (the structure, plus the photo shape and which sections
 * show), Colours, and Font. Every layout card is drawn in the colours and typeface you have chosen, so they all look
 * alike except for their structure. Everything travels with the profile form in hidden fields (template, scheme, accent,
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
  const [tab, setTab] = useState<Tab>("layout");
  const [layout, setLayout] = useState<LayoutId | undefined>(template);
  const [scheme, setScheme] = useState<SchemeId>(style?.scheme ?? DEFAULT_SCHEME);
  const [accent, setAccent] = useState<string | undefined>(style?.accent);
  const [font, setFont] = useState<FontPairId>(style?.font ?? DEFAULT_FONT);
  const [shape, setShape] = useState<PhotoShape>(style?.shape ?? DEFAULT_SHAPE);
  const [hidden, setHidden] = useState<SectionKey[]>(style?.hidden ?? []);

  const current: ProfileStyle = useMemo(() => ({ scheme, accent, font, shape, hidden }), [scheme, accent, font, shape, hidden]);
  const schemeDef = getScheme(scheme);
  const changed = scheme !== DEFAULT_SCHEME || accent || font !== DEFAULT_FONT || shape !== DEFAULT_SHAPE || hidden.length > 0;
  const layoutNumber = layout ? LAYOUTS.findIndex((l) => l.id === layout) + 1 : 0;

  function reset() {
    setScheme(DEFAULT_SCHEME);
    setAccent(undefined);
    setFont(DEFAULT_FONT);
    setShape(DEFAULT_SHAPE);
    setHidden([]);
  }

  const previewHref = (() => {
    const q = new URLSearchParams({ template: layout ?? SAMPLE_LAYOUT, scheme, font, shape });
    if (accent) q.set("accent", accent);
    for (const h of hidden) q.append("hide", h);
    return `/preview/${slug}?${q.toString()}`;
  })();

  return (
    <div className={`${TEMPLATE_FONT_CLASSES} py-6`}>
      <input type="hidden" name="template" value={layout ?? ""} />
      {layout && (
        <>
          <input type="hidden" name="scheme" value={scheme} />
          {accent && <input type="hidden" name="accent" value={accent} />}
          <input type="hidden" name="font" value={font} />
          <input type="hidden" name="shape" value={shape} />
          {hidden.map((h) => <input key={h} type="hidden" name="hide" value={h} />)}
        </>
      )}
      {/* Keeps a profile that has not chosen a layout yet on the colour theme it already has. */}
      <div className="hidden">
        <ThemePicker selected={colorTheme ?? DEFAULT_COLOR_THEME} />
      </div>

      <div role="tablist" aria-label="Appearance" className="flex gap-1 border-b border-black/[0.08]">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`appearance-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`appearance-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <span className={`flex size-5 items-center justify-center rounded-full text-[11px] ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-black/[0.07]"}`}>{i + 1}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        {/* Preview, always in the current colours and typeface */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-xl shadow-[0_18px_40px_-22px_rgba(0,0,0,0.45)] ring-1 ring-black/10">
            <TemplateThumb id={layout ?? SAMPLE_LAYOUT} style={current} />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <Summary label="Layout" value={layout ? `Layout ${layoutNumber}` : "Not chosen yet"} />
            <Summary label="Colours" value={`${schemeDef.name}${accent ? " + custom accent" : ""}`} />
            <Summary label="Font" value={getFontPair(font).name} />
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
          <p className="mt-2 text-xs text-muted">A private preview of your page. Nothing is saved until you press Save changes.</p>
          {changed && (
            <button type="button" onClick={reset} className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted ring-1 ring-black/[0.1] transition hover:bg-black/[0.04] hover:text-foreground">
              <RotateCcw className="size-3.5" aria-hidden />
              Reset
            </button>
          )}
        </div>

        <div className="min-w-0">
          {tab === "layout" && (
            <div role="tabpanel" id="appearance-panel-layout" aria-labelledby="appearance-tab-layout" className="space-y-12">
              <section>
                <Heading title="Choose a layout" hint="How your page is organised. Every layout is shown in your colours and font, so only the structure differs." />
                <div role="radiogroup" aria-label="Layout" id="template" className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 xl:grid-cols-4">
                  {LAYOUTS.map((l, i) => {
                    const on = layout === l.id;
                    return (
                      <button key={l.id} type="button" role="radio" aria-checked={on} onClick={() => setLayout(l.id)} className="group cursor-pointer text-left outline-none">
                        <span className={`relative block overflow-hidden rounded-xl transition duration-200 group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-primary ${on ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-black/[0.1] group-hover:shadow-md"}`}>
                          <TemplateThumb id={l.id} style={current} />
                          {on && (
                            <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                              <Check className="size-3.5" strokeWidth={3} aria-hidden />
                            </span>
                          )}
                        </span>
                        <span className="mt-2.5 block text-sm font-semibold">Layout {i + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <Heading title="Photo shape" hint="How your photo is cropped." />
                <div className="flex flex-wrap gap-2.5">
                  {PHOTO_SHAPES.map((s) => {
                    const on = shape === s.id;
                    const geometry = SHAPE_STYLE[s.id];
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setShape(s.id)}
                        className={`flex w-[4.8rem] cursor-pointer flex-col items-center gap-2 rounded-xl bg-surface px-2 py-3 text-xs transition ${on ? "ring-2 ring-primary" : "ring-1 ring-black/[0.08] hover:ring-black/20"}`}
                      >
                        <span className="block w-8 bg-foreground/70" style={{ aspectRatio: geometry.aspect, borderRadius: geometry.radius }} />
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <Heading title="Sections" hint="Switch off anything you would rather not show. About me and your contact details always show." />
                <div className="grid gap-2 sm:grid-cols-2">
                  {SECTION_KEYS.map((key) => {
                    const on = !hidden.includes(key);
                    return (
                      <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface px-3.5 py-3 text-sm ring-1 ring-black/[0.08] transition hover:ring-black/20">
                        <input type="checkbox" checked={on} onChange={() => setHidden(on ? [...hidden, key] : hidden.filter((h) => h !== key))} className="size-4 accent-[var(--primary)]" />
                        {SECTION_LABELS[key]}
                      </label>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {tab === "colours" && (
            <div role="tabpanel" id="appearance-panel-colours" aria-labelledby="appearance-tab-colours" className="space-y-10">
              <section>
                <Heading title="Colour scheme" hint="The colours of the whole page. Any scheme works with any layout." />
                <div role="radiogroup" aria-label="Colour scheme" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {SCHEMES.map((s) => {
                    const on = scheme === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setScheme(s.id)}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl bg-surface p-2.5 text-left transition ${on ? "ring-2 ring-primary" : "ring-1 ring-black/[0.08] hover:ring-black/20"}`}
                      >
                        <span aria-hidden className="relative flex h-10 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10" style={{ background: s.palette.bg }}>
                          <span className="absolute inset-y-0 right-0 w-5" style={{ background: s.palette.alt }} />
                          <span className="absolute bottom-1.5 left-1.5 size-4 rounded-full" style={{ background: s.palette.accent }} />
                          <span className="absolute top-1.5 left-1.5 h-1.5 w-6 rounded-full" style={{ background: s.palette.ink, opacity: 0.7 }} />
                        </span>
                        <span className="min-w-0 text-xs leading-snug font-medium">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <Heading title="Accent colour" hint="Buttons, highlights and links. Optional: it replaces only the accent of the scheme above." />
                <div className="flex flex-wrap items-center gap-2.5">
                  <Swatch label={`Scheme accent (${schemeDef.name})`} color={schemeDef.palette.accent} selected={!accent} onClick={() => setAccent(undefined)} />
                  {ACCENT_PRESETS.map((a) => (
                    <Swatch key={a.hex} label={a.name} color={a.hex} selected={same(accent, a.hex)} onClick={() => setAccent(a.hex)} />
                  ))}
                  <label className="relative flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-black/[0.15] transition hover:scale-105" title="Choose any colour">
                    <span aria-hidden className="absolute inset-0" style={{ background: "conic-gradient(#e0554a, #e9b13a, #7cb35a, #3d9bb5, #6a62c4, #d65a9a, #e0554a)" }} />
                    <span aria-hidden className="relative size-3.5 rounded-full bg-white ring-1 ring-black/20" />
                    <input type="color" aria-label="Choose any accent colour" value={accent ?? schemeDef.palette.accent} onChange={(e) => setAccent(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
                  </label>
                </div>
              </section>
            </div>
          )}

          {tab === "font" && (
            <div role="tabpanel" id="appearance-panel-font" aria-labelledby="appearance-tab-font">
              <Heading title="Font" hint="The lettering for headings and text. Sizes are the same for all of them." />
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                {FONT_PAIRS.map((f) => {
                  const on = font === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setFont(f.id)}
                      className={`flex cursor-pointer flex-col gap-1 rounded-xl bg-surface px-4 py-3.5 text-left transition ${on ? "ring-2 ring-primary" : "ring-1 ring-black/[0.08] hover:ring-black/20"}`}
                    >
                      <span className="text-2xl leading-none" style={{ fontFamily: `var(${f.display})`, fontWeight: f.weight }}>
                        Aa
                      </span>
                      <span className="mt-1 text-sm font-medium">{f.name}</span>
                      <span className="truncate text-xs text-muted">{f.note}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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

function Swatch({ label, color, selected, onClick }: { label: string; color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex size-9 cursor-pointer items-center justify-center rounded-full transition hover:scale-105 ${selected ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-black/[0.15]"}`}
      style={{ background: color }}
    >
      <Check className={`size-4 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.7)] ${selected ? "opacity-100" : "opacity-0"}`} strokeWidth={3} aria-hidden />
    </button>
  );
}
