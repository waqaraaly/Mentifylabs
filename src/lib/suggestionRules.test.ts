import { describe, expect, it } from "vitest";
import { parseSuggestion, SUGGESTION_MAX_LENGTH } from "./suggestionRules";

describe("a suggestion", () => {
  it("needs at least one of the two answers", () => {
    expect(parseSuggestion("", "  ")).toMatchObject({ ok: false });
    expect(parseSuggestion(null, null)).toMatchObject({ ok: false });
  });

  it("accepts either answer on its own, or both, and trims them", () => {
    expect(parseSuggestion("  Faster booking ", "")).toEqual({ ok: true, improve: "Faster booking", features: undefined });
    expect(parseSuggestion("", "Reminders")).toEqual({ ok: true, improve: undefined, features: "Reminders" });
    expect(parseSuggestion("a", "b")).toEqual({ ok: true, improve: "a", features: "b" });
  });

  it("limits each answer's length", () => {
    expect(parseSuggestion("x".repeat(SUGGESTION_MAX_LENGTH), "")).toMatchObject({ ok: true });
    expect(parseSuggestion("x".repeat(SUGGESTION_MAX_LENGTH + 1), "")).toMatchObject({ ok: false });
  });

  it("keeps paragraphs but collapses long runs of blank lines", () => {
    expect(parseSuggestion("one\r\n\r\n\r\n\r\ntwo", "")).toMatchObject({ ok: true, improve: "one\n\ntwo" });
  });
});
