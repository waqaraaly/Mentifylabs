import { describe, expect, it } from "vitest";
import { handleFromName } from "./handleFromName";

describe("the link a name would make", () => {
  it("joins the words with hyphens", () => {
    expect(handleFromName("Ayesha Khan")).toBe("ayesha-khan");
    expect(handleFromName("Dr. Ayesha Khan")).toBe("dr-ayesha-khan");
  });
  it("drops accents and symbols and collapses the gaps they leave", () => {
    expect(handleFromName("Zoë  O'Brien!!")).toBe("zoe-o-brien");
  });
  it("is empty when the name has no letters or numbers, so there is nothing to suggest", () => {
    expect(handleFromName("")).toBe("");
    expect(handleFromName("  !!  ")).toBe("");
    expect(handleFromName("آمنہ")).toBe("");
  });
  it("stops at 30 characters without leaving a hyphen on the end", () => {
    const link = handleFromName("Muhammad Abdullah Rahman Siddiqui Al Farooqi");
    expect(link.length).toBeLessThanOrEqual(30);
    expect(link.endsWith("-")).toBe(false);
    expect(link.startsWith("muhammad-abdullah-rahman")).toBe(true);
  });
});
