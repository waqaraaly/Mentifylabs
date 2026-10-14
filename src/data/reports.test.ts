import { describe, expect, it } from "vitest";
import { REPORT_RANGES } from "@/lib/reportRanges";
import { getReport } from "./reports";

describe("the report periods", () => {
  it("offers 30 days, 90 days, 6 months, 12 months and all time", () => {
    expect([...REPORT_RANGES]).toEqual([30, 90, 180, 365, "all"]);
  });

  it("covers a fixed number of days for the numeric periods", async () => {
    const report = await getReport(180);
    expect(report).toMatchObject({ range: 180, allTime: false });
  });

  it("reaches back to the earliest practitioner or appointment for all time, and says so", async () => {
    const report = await getReport("all");
    expect(report.allTime).toBe(true);
    expect(report.range).toBeGreaterThanOrEqual(30);
    // Nobody who ever signed up can fall outside "all time".
    expect(report.funnel.cohort).toBe(report.totals.practitioners);
  });
});
