import { describe, expect, it } from "vitest";
import { FONT_PAIRS, LAYOUTS, LAYOUT_FAMILIES, SCHEMES, normalizeSelection, resolveDesign } from "./templates";

describe("the profile design choices", () => {
  it("offer seventeen layouts in seven families, none of which name a colour", () => {
    expect(LAYOUTS).toHaveLength(17);
    expect(LAYOUT_FAMILIES).toHaveLength(7);
    expect(new Set(LAYOUTS.map((l) => l.id)).size).toBe(17);
    const colourWords = /\b(teal|navy|green|blue|plum|sand|clay|petrol|mint|sky|sage|olive|walnut|indigo|lavender)\b/i;
    for (const l of LAYOUTS) expect(`${l.name} ${l.description}`).not.toMatch(colourWords);
  });

  it("offer twenty colour schemes, each complete, with exactly two dark ones", () => {
    expect(SCHEMES).toHaveLength(20);
    expect(new Set(SCHEMES.map((s) => s.id)).size).toBe(20);
    expect(SCHEMES.filter((s) => s.palette.dark)).toHaveLength(2);
    for (const s of SCHEMES) expect(Object.keys(s.palette)).toEqual(expect.arrayContaining(["bg", "surface", "ink", "accent", "alt"]));
  });

  it("keep type sizes within a few per cent of each other across the typefaces", () => {
    const scales = FONT_PAIRS.map((f) => f.scale);
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

  it("recolour only the accent and its tint when an accent is chosen", () => {
    const base = resolveDesign("rail-band", { scheme: "sand-petrol" });
    const custom = resolveDesign("rail-band", { scheme: "sand-petrol", accent: "#b5543a" });
    expect(custom.vars["--pt-accent"]).toBe("#b5543a");
    expect(custom.vars["--pt-alt"]).not.toBe(base.vars["--pt-alt"]);
    expect(custom.vars["--pt-bg"]).toBe(base.vars["--pt-bg"]);
  });
});

describe("older saves that named a whole template", () => {
  it("become the same look as a layout plus colours, typeface and photo shape", () => {
    expect(normalizeSelection("harbour", undefined)).toEqual({
      template: "rail-band",
      style: { scheme: "sand-petrol", font: "lexend-source", shape: "circle" },
    });
    expect(normalizeSelection("atelier", undefined).template).toBe("clinic-compact");
  });

  it("keep the practitioner's own changes on top of the old template's look", () => {
    expect(normalizeSelection("harbour", { accent: "#112233", hidden: ["services"] }).style).toEqual({
      scheme: "sand-petrol",
      font: "lexend-source",
      shape: "circle",
      accent: "#112233",
      hidden: ["services"],
    });
  });

  it("leave a layout id as it is, and treat anything unknown as the original design", () => {
    expect(normalizeSelection("tabs-band", { scheme: "sage" })).toEqual({ template: "tabs-band", style: { scheme: "sage" } });
    expect(normalizeSelection("neon-casino", { scheme: "sage" })).toEqual({ template: undefined, style: undefined });
    expect(normalizeSelection(null, undefined).template).toBeUndefined();
  });
});
