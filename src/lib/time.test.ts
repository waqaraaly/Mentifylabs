import { describe, expect, it } from "vitest";
import {
  dayOfIn,
  greetingIn,
  instantOf,
  isPastIn,
  isValidTimeZone,
  offsetLabel,
  timeZoneOptions,
  todayIn,
  wallClockIn,
  zoneOrDefault,
  zoneTag,
} from "./time";

const at = (iso: string) => Date.parse(iso);

describe("what the clock says in a zone", () => {
  it("is the same moment on different clocks", () => {
    const moment = at("2026-10-06T05:00:00Z");
    expect(wallClockIn("UTC", moment)).toMatchObject({ date: "2026-10-06", time: "05:00" });
    expect(wallClockIn("Asia/Karachi", moment)).toMatchObject({ date: "2026-10-06", time: "10:00", minutes: 600 });
    expect(wallClockIn("America/New_York", moment)).toMatchObject({ date: "2026-10-06", time: "01:00" });
  });

  it("puts the date on the right side of midnight", () => {
    // 8 PM UTC on the 5th: already the 6th in Karachi, still the 5th in Los Angeles.
    const moment = at("2026-10-05T20:00:00Z");
    expect(todayIn("Asia/Karachi", moment)).toBe("2026-10-06");
    expect(todayIn("America/Los_Angeles", moment)).toBe("2026-10-05");
    expect(todayIn("Pacific/Kiritimati", moment)).toBe("2026-10-06"); // UTC+14
  });

  it("handles half-hour zones", () => {
    expect(wallClockIn("Asia/Kolkata", at("2026-10-06T05:00:00Z")).time).toBe("10:30");
    expect(wallClockIn("Asia/Kathmandu", at("2026-10-06T05:00:00Z")).time).toBe("10:45");
  });

  it("reads midnight as 00:00, not 24:00", () => {
    expect(wallClockIn("Asia/Karachi", at("2026-10-05T19:00:00Z"))).toMatchObject({ date: "2026-10-06", time: "00:00", minutes: 0 });
  });

  it("finds the day a timestamp falls on for that zone", () => {
    expect(dayOfIn("2026-10-05T21:30:00Z", "Asia/Karachi")).toBe("2026-10-06");
    expect(dayOfIn("2026-10-05T21:30:00Z", "America/New_York")).toBe("2026-10-05");
  });
});

describe("a wall-clock time as a real moment", () => {
  it("converts at the zone's offset", () => {
    expect(instantOf("2026-10-06", "10:00", "Asia/Karachi")).toBe(at("2026-10-06T05:00:00Z"));
    expect(instantOf("2026-10-06", "10:00", "Asia/Kolkata")).toBe(at("2026-10-06T04:30:00Z"));
    expect(instantOf("2026-01-15", "09:00", "America/New_York")).toBe(at("2026-01-15T14:00:00Z")); // winter, UTC-5
    expect(instantOf("2026-07-15", "09:00", "America/New_York")).toBe(at("2026-07-15T13:00:00Z")); // summer, UTC-4
  });

  it("round-trips through the clock in that zone", () => {
    for (const zone of ["Asia/Karachi", "America/New_York", "Europe/London", "Australia/Sydney", "Pacific/Kiritimati"]) {
      for (const [date, time] of [["2026-01-10", "00:00"], ["2026-06-20", "13:45"], ["2026-12-31", "23:59"]]) {
        const back = wallClockIn(zone, instantOf(date, time, zone));
        expect([back.date, back.time]).toEqual([date, time]);
      }
    }
  });

  it("keeps a recurring 10:00 at 10:00 across a daylight-saving change", () => {
    // New York springs forward on 8 March 2026: 10:00 local is 15:00 UTC before it and 14:00 UTC after.
    expect(instantOf("2026-03-07", "10:00", "America/New_York")).toBe(at("2026-03-07T15:00:00Z"));
    expect(instantOf("2026-03-09", "10:00", "America/New_York")).toBe(at("2026-03-09T14:00:00Z"));
    // Karachi has no daylight saving, so it never moves.
    expect(instantOf("2026-03-07", "10:00", "Asia/Karachi")).toBe(at("2026-03-07T05:00:00Z"));
    expect(instantOf("2026-03-09", "10:00", "Asia/Karachi")).toBe(at("2026-03-09T05:00:00Z"));
  });

  it("resolves a time that daylight saving skips to just after the gap, and a repeated time to the first", () => {
    // 02:30 on 8 March 2026 does not exist in New York (02:00 jumps to 03:00).
    const skipped = wallClockIn("America/New_York", instantOf("2026-03-08", "02:30", "America/New_York"));
    expect(skipped.date).toBe("2026-03-08");
    expect(skipped.time >= "03:00").toBe(true);
    // 01:30 on 1 November 2026 happens twice; the first one is still daylight time (UTC-4).
    expect(instantOf("2026-11-01", "01:30", "America/New_York")).toBe(at("2026-11-01T05:30:00Z"));
  });
});

describe("has a session already started", () => {
  const nowKarachi = at("2026-10-06T05:00:00Z"); // 10:00 AM in Karachi

  it("compares on the clock of the zone given", () => {
    expect(isPastIn("2026-10-06", "09:00", "Asia/Karachi", nowKarachi)).toBe(true);
    expect(isPastIn("2026-10-06", "10:00", "Asia/Karachi", nowKarachi)).toBe(true); // starting right now
    expect(isPastIn("2026-10-06", "10:01", "Asia/Karachi", nowKarachi)).toBe(false);
    expect(isPastIn("2026-10-05", "23:59", "Asia/Karachi", nowKarachi)).toBe(true);
    expect(isPastIn("2026-10-07", "00:00", "Asia/Karachi", nowKarachi)).toBe(false);
  });

  it("gives a different answer for the same wall-clock time in a different zone", () => {
    // 09:00 on the 6th is over in Karachi but still ahead in New York, where it is 01:00.
    expect(isPastIn("2026-10-06", "09:00", "Asia/Karachi", nowKarachi)).toBe(true);
    expect(isPastIn("2026-10-06", "09:00", "America/New_York", nowKarachi)).toBe(false);
  });
});

describe("greetings and labels", () => {
  it("greets by the hour in the zone, not the server's", () => {
    const moment = at("2026-10-06T07:00:00Z"); // 12:00 in Karachi, 03:00 in New York
    expect(greetingIn("Asia/Karachi", moment)).toBe("Good afternoon");
    expect(greetingIn("America/New_York", moment)).toBe("Good morning");
    expect(greetingIn("Asia/Karachi", at("2026-10-06T13:30:00Z"))).toBe("Good evening"); // 18:30
  });

  it("tags and offsets zones in words people recognise", () => {
    expect(zoneTag("Asia/Karachi")).toBe("PKT");
    expect(zoneTag("America/New_York", at("2026-07-15T12:00:00Z"))).toBe("EDT");
    expect(zoneTag("America/New_York", at("2026-01-15T12:00:00Z"))).toBe("EST");
    expect(offsetLabel("Asia/Karachi")).toBe("UTC+5");
    expect(offsetLabel("Asia/Kolkata")).toBe("UTC+5:30");
    expect(offsetLabel("America/New_York", at("2026-07-15T12:00:00Z"))).toBe("UTC-4");
  });
});

describe("zone names", () => {
  it("accepts real zones and rejects everything else", () => {
    expect(isValidTimeZone("Asia/Karachi")).toBe(true);
    expect(isValidTimeZone("America/New_York")).toBe(true);
    for (const bad of ["", "Karachi", "UTC+5", "PKT", "Mars/Olympus_Mons", null, undefined]) expect(isValidTimeZone(bad)).toBe(false);
  });

  it("falls back to the default for a bad or missing zone", () => {
    expect(zoneOrDefault("America/New_York")).toBe("America/New_York");
    expect(zoneOrDefault("nonsense")).toBe("Asia/Karachi");
    expect(zoneOrDefault(undefined)).toBe("Asia/Karachi");
  });

  it("lists every zone for the picker, with the offset in the label", () => {
    const options = timeZoneOptions();
    expect(options.length).toBeGreaterThan(100);
    expect(options.find((o) => o.value === "Asia/Karachi")?.label).toBe("Asia/Karachi (UTC+5)");
    // Ordered from the earliest clocks to the latest: the first is behind UTC, the last is ahead of it.
    expect(options[0].label).toMatch(/UTC-/);
    expect(options[options.length - 1].label).toMatch(/UTC\+/);
  });
});
