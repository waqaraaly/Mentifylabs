import { describe, expect, it } from "vitest";
import { formatStamp } from "./stamp";

describe("showing a stored moment to a reader", () => {
  const moment = "2026-10-07T08:51:00.000Z";

  it("reads in the reader's own time zone and names it", () => {
    expect(formatStamp(moment, "Asia/Karachi")).toBe("7 Oct 2026, 1:51 PM PKT");
    expect(formatStamp(moment, "America/New_York")).toBe("7 Oct 2026, 4:51 AM EDT");
  });

  it("can move to another date: late evening UTC is already the next morning in Karachi", () => {
    expect(formatStamp("2026-10-07T21:30:00.000Z", "Asia/Karachi")).toBe("8 Oct 2026, 2:30 AM PKT");
  });

  it("reads in UTC, and says so, when there is no zone yet", () => {
    expect(formatStamp(moment)).toBe("7 Oct 2026, 8:51 AM UTC");
  });

  it("shows noon and midnight as 12, not 0", () => {
    expect(formatStamp("2026-10-07T07:05:00.000Z", "Asia/Karachi")).toBe("7 Oct 2026, 12:05 PM PKT");
    expect(formatStamp("2026-10-07T19:00:00.000Z", "Asia/Karachi")).toBe("8 Oct 2026, 12:00 AM PKT");
  });

  it("leaves a plain date alone, with no time or zone", () => {
    expect(formatStamp("2026-10-05", "Asia/Karachi")).toBe("5 Oct 2026");
    expect(formatStamp("2026-10-05")).toBe("5 Oct 2026");
  });

  it("returns something unreadable as it came rather than failing", () => {
    expect(formatStamp("not-a-date-at-all", "Asia/Karachi")).toBe("not-a-date-at-all");
  });
});
