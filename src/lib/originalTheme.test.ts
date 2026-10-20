import { describe, expect, it } from "vitest";
import { contrast } from "./color";
import { originalThemeVars } from "./originalTheme";
import { SCHEMES } from "./templates";

describe("the original design in a colour scheme", () => {
  it("takes its page, text and accent from the scheme", () => {
    for (const s of SCHEMES) {
      const vars = originalThemeVars(s.palette);
      expect(vars["--pt-bg"]).toBe(s.palette.bg);
      expect(vars["--pt-text"]).toBe(s.palette.ink);
      expect(vars["--pt-accent"]).toBe(s.palette.accent);
    }
  });

  it("keeps the text on the Reach Out card and on buttons readable in every scheme", () => {
    for (const s of SCHEMES) {
      const vars = originalThemeVars(s.palette);
      expect(contrast(vars["--pt-dark-card"], vars["--pt-dark-card-foreground"])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(vars["--pt-accent"], vars["--pt-accent-foreground"])).toBeGreaterThanOrEqual(3);
    }
  });
});
