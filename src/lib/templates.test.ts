import { describe, expect, it } from "vitest";
import { contrast } from "./color";
import { chosenFaces, cleanColors, cleanStyle, getScheme, resolvePalette, nearestScheme, resolveFont, HEADING_FACES, LAYOUTS, LAYOUT_FAMILIES, SCHEMES, normalizeSelection, resolveDesign } from "./templates";

describe("the profile design choices", () => {
  it("offer two layouts in two families, none of which name a colour", () => {
    expect(LAYOUTS).toHaveLength(2);
    expect(LAYOUT_FAMILIES).toHaveLength(2);
    expect(new Set(LAYOUTS.map((l) => l.id)).size).toBe(2);
    const colourWords = /\b(teal|navy|green|blue|plum|sand|clay|petrol|mint|sky|sage|olive|walnut|indigo|lavender)\b/i;
    for (const l of LAYOUTS) expect(`${l.name} ${l.description}`).not.toMatch(colourWords);
  });

  it("offer twenty-one colour schemes, each complete, with exactly two dark ones", () => {
    expect(SCHEMES).toHaveLength(21);
    expect(new Set(SCHEMES.map((s) => s.id)).size).toBe(21);
    expect(SCHEMES.filter((s) => s.palette.dark)).toHaveLength(2);
    for (const s of SCHEMES) expect(Object.keys(s.palette)).toEqual(expect.arrayContaining(["bg", "surface", "ink", "accent", "alt"]));
  });

  it("keep type sizes within a few per cent of each other across the typefaces", () => {
    const scales = HEADING_FACES.map((f) => f.heading!.scale);
    expect(Math.max(...scales) - Math.min(...scales)).toBeLessThan(0.2);
  });

  it("let any layout take any colour scheme and typeface", () => {
    for (const l of LAYOUTS) for (const s of SCHEMES) {
      const { vars } = resolveDesign(l.id, { scheme: s.id });
      expect(vars["--pt-bg"]).toBe(s.palette.bg);
      expect(vars["--pt-accent"]).toBe(s.palette.accent);
    }
  });

  it("change nothing but the colours when only the scheme changes", () => {
    const a = resolveDesign("rail-card", { scheme: "teal-white", font: "atkinson", shape: "oval" });
    const b = resolveDesign("rail-card", { scheme: "navy-mint", font: "atkinson", shape: "oval" });
    expect(a.vars["--pt-display"]).toBe(b.vars["--pt-display"]);
    expect(a.vars["--pt-r"]).toBe(b.vars["--pt-r"]);
    expect(a.shape).toBe(b.shape);
    expect(a.vars["--pt-bg"]).not.toBe(b.vars["--pt-bg"]);
  });
});

describe("older saves that named a whole template", () => {
  it("become the same look as a layout plus colours, typeface and photo shape", () => {
    expect(normalizeSelection("harbour", undefined)).toEqual({
      template: "rail-card",
      style: { scheme: "sand-petrol", font: "lexend-source", shape: "circle" },
    });
    expect(normalizeSelection("atelier", undefined).template).toBe("rail-card");
  });

  it("keep the practitioner's own changes on top of the old template's look", () => {
    expect(normalizeSelection("harbour", { shape: "oval" }).style).toEqual({
      scheme: "sand-petrol",
      font: "lexend-source",
      shape: "oval",
    });
  });

  it("leave a layout id as it is, and treat anything unknown as the original design", () => {
    expect(normalizeSelection("link-page", { scheme: "sage" })).toEqual({ template: "link-page", style: { scheme: "sage" } });
    expect(normalizeSelection("neon-casino", { scheme: "sage" })).toEqual({ template: undefined, style: undefined });
    expect(normalizeSelection(null, undefined).template).toBeUndefined();
  });
});

describe("heading and text typefaces", () => {
  it("are chosen separately, over an older saved pair", () => {
    const font = resolveFont({ font: "fraunces-public", headingFont: "lexend" });
    expect(font.display).toBe("--f-lexend");
    expect(font.body).toBe("--f-public");
    expect(font.weight).toBe(600);
  });

  it("split an older pair into its heading and text faces", () => {
    expect(resolveFont({ font: "lexend-source" })).toMatchObject({ display: "--f-lexend", body: "--f-source" });
  });

  it("only accept faces that suit the job", () => {
    expect(cleanStyle({ headingFont: "source", textFont: "nunito" })).toBeUndefined();
    expect(cleanStyle({ headingFont: "fraunces", textFont: "public" })).toEqual({ headingFont: "fraunces", textFont: "public" });
  });

  it("leave the original design's own face in place for whichever one was not chosen", () => {
    expect(chosenFaces({ headingFont: "newsreader" })).toEqual({ display: "--f-newsreader", body: undefined });
    expect(chosenFaces(undefined)).toEqual({ display: undefined, body: undefined });
  });
});

describe("the original design in a colour scheme", () => {
  it("is shown in the scheme closest to its colour theme", () => {
    expect(SCHEMES.map((x) => x.id)).toContain(nearestScheme("moss-honey"));
    expect(nearestScheme("moss-honey")).toBe("cream-olive");
    expect(nearestScheme("nonsense")).toBe("teal-white");
    expect(nearestScheme(undefined)).toBe("teal-white");
  });
});

describe("colours picked for single parts of the page", () => {
  const base = getScheme("teal-white").palette;

  it("change only the part chosen", () => {
    const p = resolvePalette(base, { accent: "#b5543a" });
    expect(p.accent).toBe("#b5543a");
    expect(p.bg).toBe(base.bg);
    expect(p.ink).toBe(base.ink);
    expect(resolvePalette(base, undefined)).toBe(base);
  });

  it("bring light text and cards with a page that turns dark", () => {
    const p = resolvePalette(base, { page: "#0e1a2b" });
    expect(p.dark).toBe(true);
    expect(p.ink).toBe("#e8eef5");
    expect(p.surface).not.toBe(base.surface);
  });

  it("keep text and accent readable on the page they are on", () => {
    const p = resolvePalette(base, { page: "#ffffff", text: "#fafafa", accent: "#f8f8f8" });
    expect(contrast(p.ink, p.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.accent, p.bg)).toBeGreaterThanOrEqual(3);
  });

  it("accept only plain hex colours", () => {
    expect(cleanColors({ page: "#FFF000", text: "red; x:y", accent: "#12", panels: 5 })).toEqual({ page: "#fff000" });
    expect(cleanColors(null)).toBeUndefined();
    expect(cleanStyle({ colors: { accent: "#A94662" } })).toEqual({ colors: { accent: "#a94662" } });
  });
});
