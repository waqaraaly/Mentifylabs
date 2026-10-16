"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, ExternalLink, RotateCcw } from "lucide-react";
import {
  ACCENT_PRESETS,
  FONT_PAIRS,
  PHOTO_SHAPES,
  SECTION_KEYS,
  SECTION_LABELS,
  TEMPLATES,
  TEMPLATE_GROUPS,
  getTemplate,
  type FontPairId,
  type PhotoShape,
  type ProfileStyle,
  type SectionKey,
  type TemplateGroup,
  type TemplateId,
} from "@/lib/templates";
import { COLOR_THEMES, DEFAULT_COLOR_THEME, type ColorThemeId } from "@/lib/themes";
import { TEMPLATE_FONT_CLASSES } from "@/components/practitioner/templates/fonts";
import { SHAPE_STYLE } from "@/components/practitioner/templates/parts";
import { TemplateThumb } from "@/components/portal/TemplateThumb";
import { ThemePicker } from "@/components/portal/ThemePicker";

type Choice = TemplateId | "classic";
type Filter = "All" | "Classic" | TemplateGroup;

const FILTERS: Filter[] = ["All", ...TEMPLATE_GROUPS, "Classic"];

/** The same hex colours the swatch buttons use, so "is this one picked" is a plain comparison. */
const same = (a?: string, b?: string) => (a ?? "").toLowerCase() === (b ?? "").toLowerCase();

/**
 * Appearance: pick one of the templates, then change its accent colour, typeface, photo shape and which sections show.
 * Everything travels with the profile form through hidden fields (template, accent, font, shape, hide), because the form
 * is reset after a save and native inputs would snap back to what the page first loaded with.
 * "Classic" is the original design, which keeps its own colour themes.
 */
export function AppearanceEditor({
  slug,
  template,
  style,
  colorTheme,
}: {
  slug: string;
  template?: TemplateId;
  style?: ProfileStyle;
  colorTheme?: ColorThemeId;
}) {
  const [choice, setChoice] = useState<Choice>(template ?? "classic");
  const [accent, setAccent] = useState<string | undefined>(style?.accent);
  const [font, setFont] = useState<FontPairId | undefined>(style?.font);
  const [shape, setShape] = useState<PhotoShape | undefined>(style?.shape);
  const [hidden, setHidden] = useState<SectionKey[]>(style?.hidden ?? []);
  const [filter, setFilter] = useState<Filter>("All");

  const current: ProfileStyle = useMemo(() => ({ accent, font, shape, hidden }), [accent, font, shape, hidden]);
  const spec = choice === "classic" ? null : getTemplate(choice);
  const classic = COLOR_THEMES.find((t) => t.id === (colorTheme ?? DEFAULT_COLOR_THEME)) ?? COLOR_THEMES[0];

  const visible = TEMPLATES.filter((t) => filter === "All" || t.group === filter);
  const changed = Boolean(accent || font || shape || hidden.length);

  function pick(next: Choice) {
    setChoice(next);
    // Changes belong to the template they were made on; a different template starts from its own look.
    if (next !== choice) {
      setAccent(undefined);
      setFont(undefined);
      setShape(undefined);
      setHidden([]);
    }
  }

  const reset = () => {
    setAccent(undefined);
    setFont(undefined);
    setShape(undefined);
    setHidden([]);
  };

  const previewHref = (() => {
    const q = new URLSearchParams({ template: choice });
    if (spec) {
      if (accent) q.set("accent", accent);
      if (font) q.set("font", font);
      if (shape) q.set("shape", shape);
      for (const h of hidden) q.append("hide", h);
    }
    return `/preview/${slug}?${q.toString()}`;
  })();

  return (
    <div className={`${TEMPLATE_FONT_CLASSES} py-6`}>
      <input type="hidden" name="template" value={choice === "classic" ? "" : choice} />
      {spec && accent && <input type="hidden" name="accent" value={accent} />}
      {spec && font && <input type="hidden" name="font" value={font} />}
      {spec && shape && <input type="hidden" name="shape" value={shape} />}
      {spec && hidden.map((h) => <input key={h} type="hidden" name="hide" value={h} />)}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h3 className="text-base font-semibold tracking-tight">Choose a template</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Each one is a complete design for your public page. Pick one you like, then make it yours below. Your words and photo stay the same whichever you choose.
          </p>
        </div>
        <div role="group" aria-label="Filter templates" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === f ? "bg-foreground text-background" : "bg-black/[0.04] text-muted hover:bg-black/[0.08]"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div role="radiogroup" aria-label="Template" id="template" className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 xl:grid-cols-4">
        {(filter === "All" || filter === "Classic") && (
          <Card selected={choice === "classic"} name="Classic" mood="The original look, with your choice of colours." onPick={() => pick("classic")}>
            <div className="flex aspect-[4/5] flex-col p-2" style={{ background: classic.swatches[1] }}>
              <div className="flex flex-1 flex-col gap-2 rounded-lg p-3" style={{ background: classic.swatches[0] }}>
                <div className="flex items-center gap-2">
                  <span className="size-9 rounded-[55%_45%_50%_50%/50%_55%_45%_50%]" style={{ background: classic.swatches[1] }} />
                  <span className="flex flex-col gap-1">
                    <span className="block h-1.5 w-12 rounded-full" style={{ background: classic.swatches[2] }} />
                    <span className="block h-1 w-8 rounded-full bg-black/15" />
                  </span>
                </div>
                <span className="block h-1 w-full rounded-full bg-black/10" />
                <span className="block h-1 w-3/4 rounded-full bg-black/10" />
                <div className="mt-auto flex gap-1.5">
                  <span className="h-4 w-10 rounded" style={{ background: classic.swatches[3] ?? classic.swatches[1] }} />
                  <span className="h-4 flex-1 rounded" style={{ background: classic.swatches[2] }} />
                </div>
              </div>
            </div>
          </Card>
        )}
        {visible.map((t) => (
          <Card key={t.id} selected={choice === t.id} name={t.name} mood={t.mood} onPick={() => pick(t.id)}>
            <TemplateThumb id={t.id} style={choice === t.id ? current : undefined} />
          </Card>
        ))}
      </div>

      {/* Colour themes of the original design. Always mounted, so its hidden field keeps submitting the saved theme. */}
      <div className={choice === "classic" ? "mt-10" : "hidden"}>
        <h3 className="text-base font-semibold tracking-tight">Colours</h3>
        <p className="mt-1 mb-5 text-sm text-muted">The Classic design comes in these colour themes.</p>
        <ThemePicker selected={colorTheme ?? DEFAULT_COLOR_THEME} />
      </div>

      {spec && (
        <div className="mt-12 grid gap-10 rounded-2xl bg-black/[0.025] p-5 ring-1 ring-black/[0.05] sm:p-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-xl shadow-[0_18px_40px_-22px_rgba(0,0,0,0.45)] ring-1 ring-black/10">
              <TemplateThumb id={choice as TemplateId} style={current} />
            </div>
            <p className="mt-4 text-sm font-semibold">{spec.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{spec.mood}</p>
            <a
              href={previewHref}
              target="_blank"
              rel="noopener"
              className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ring-1 ring-black/[0.14] transition hover:bg-black/[0.04]"
            >
              <ExternalLink className="size-4" aria-hidden />
              Preview with my details
            </a>
            <p className="mt-2 text-xs text-muted">Opens a private preview of your page in this design. Nothing is saved until you press Save changes.</p>
          </div>

          <div className="min-w-0 space-y-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold tracking-tight">Make it yours</h3>
                <p className="mt-1 text-sm text-muted">Every choice below is optional. Leave them alone to keep the template as designed.</p>
              </div>
              {changed && (
                <button type="button" onClick={reset} className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted ring-1 ring-black/[0.1] transition hover:bg-black/[0.04] hover:text-foreground">
                  <RotateCcw className="size-3.5" aria-hidden />
                  Reset
                </button>
              )}
            </div>

            <Group label="Accent colour" hint="Used for buttons, highlights and the contact card.">
              <div className="flex flex-wrap items-center gap-2.5">
                <Swatch label="Template colour" color={spec.palette.accent} selected={!accent} onClick={() => setAccent(undefined)} />
                {ACCENT_PRESETS.map((a) => (
                  <Swatch key={a.hex} label={a.name} color={a.hex} selected={same(accent, a.hex)} onClick={() => setAccent(a.hex)} />
                ))}
                <label className="relative flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-black/[0.15] transition hover:scale-105" title="Choose any colour">
                  <span aria-hidden className="absolute inset-0" style={{ background: "conic-gradient(#e0554a, #e9b13a, #7cb35a, #3d9bb5, #6a62c4, #d65a9a, #e0554a)" }} />
                  <span aria-hidden className="relative size-3.5 rounded-full bg-white ring-1 ring-black/20" />
                  <input
                    type="color"
                    aria-label="Choose any accent colour"
                    value={accent ?? spec.palette.accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </label>
              </div>
            </Group>

            <Group label="Typeface" hint="The pairing for headings and text.">
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {FONT_PAIRS.map((f) => {
                  const on = (font ?? spec.font) === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setFont(f.id === spec.font ? undefined : f.id)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl bg-surface px-3.5 py-3 text-left transition ${on ? "ring-2 ring-primary" : "ring-1 ring-black/[0.08] hover:ring-black/20"}`}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-2xl leading-none" style={{ fontFamily: `var(${f.display})`, fontWeight: f.weight }}>
                        Aa
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{f.name}</span>
                        <span className="block truncate text-xs text-muted">{f.id === spec.font ? "Template default" : f.note}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Group>

            <Group label="Photo shape">
              <div className="flex flex-wrap gap-2.5">
                {PHOTO_SHAPES.map((s) => {
                  const on = (shape ?? spec.shape) === s.id;
                  const geometry = SHAPE_STYLE[s.id];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setShape(s.id === spec.shape ? undefined : s.id)}
                      className={`flex w-[4.6rem] cursor-pointer flex-col items-center gap-2 rounded-xl bg-surface px-2 py-3 text-xs transition ${on ? "ring-2 ring-primary" : "ring-1 ring-black/[0.08] hover:ring-black/20"}`}
                    >
                      <span className="block w-8 bg-foreground/70" style={{ aspectRatio: geometry.aspect, borderRadius: geometry.radius.replace("var(--pt-photo-r, 28px)", "22%") }} />
                      {s.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted">Templates with a full-height photo show it uncropped whatever shape you choose.</p>
            </Group>

            <Group label="Sections" hint="Switch off anything you would rather not show. About me and your contact details always show.">
              <div className="grid gap-2 sm:grid-cols-2">
                {SECTION_KEYS.map((key) => {
                  const on = !hidden.includes(key);
                  return (
                    <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface px-3.5 py-3 text-sm ring-1 ring-black/[0.08] transition hover:ring-black/20">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setHidden(on ? [...hidden, key] : hidden.filter((h) => h !== key))}
                        className="size-4 accent-[var(--primary)]"
                      />
                      {SECTION_LABELS[key]}
                    </label>
                  );
                })}
              </div>
            </Group>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ selected, name, mood, onPick, children }: { selected: boolean; name: string; mood: string; onPick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onPick} className="group cursor-pointer text-left outline-none">
      <span className={`relative block overflow-hidden rounded-xl transition duration-200 group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-primary ${selected ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-black/[0.1] group-hover:shadow-md"}`}>
        {children}
        {selected && (
          <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="size-3.5" strokeWidth={3} aria-hidden />
          </span>
        )}
      </span>
      <span className="mt-2.5 block text-sm font-semibold">{name}</span>
      <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-muted">{mood}</span>
    </button>
  );
}

function Group({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      {hint && <p className="mt-0.5 mb-3 text-xs text-muted">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
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
