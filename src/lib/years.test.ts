import { describe, expect, it } from "vitest";
import { cleanEntryYears, displayYears, toYear, yearDigits } from "./years";

describe("years on a timeline entry", () => {
  it("accept digits only, at most four", () => {
    expect(yearDigits("20a1b8x9")).toBe("2018");
    expect(yearDigits("Present")).toBe("");
    expect(yearDigits("202412")).toBe("2024");
  });

  it("turn an older Present into the current year", () => {
    expect(toYear("Present", 2026)).toBe("2026");
    expect(toYear(" current ", 2026)).toBe("2026");
    expect(toYear("2019", 2026)).toBe("2019");
    expect(toYear("soon", 2026)).toBe("");
  });

  it("make a saved entry's years plain", () => {
    expect(cleanEntryYears("MSc, UCL, 2018–Present", 2026)).toBe("MSc, UCL, 2018–2026");
    expect(cleanEntryYears("Lead, Clinic, 2015-2020", 2026)).toBe("Lead, Clinic, 2015–2020");
    expect(cleanEntryYears("Lead, Clinic, 2015", 2026)).toBe("Lead, Clinic, 2015");
    expect(cleanEntryYears("MSc, UCL", 2026)).toBe("MSc, UCL");
    expect(cleanEntryYears("MSc, UCL, 2018–later", 2026)).toBe("MSc, UCL, 2018");
  });

  it("show a range that ends this year as ending in Present", () => {
    expect(displayYears("2018–2026", 2026)).toBe("2018–Present");
    expect(displayYears("2018–2025", 2026)).toBe("2018–2025");
    expect(displayYears("2018", 2026)).toBe("2018");
    expect(displayYears("2018–Present", 2026)).toBe("2018–Present");
    expect(displayYears("", 2026)).toBe("");
  });
});
