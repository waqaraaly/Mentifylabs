import { describe, expect, it } from "vitest";
import { displayZoneFor, nextAvailable, notStarted, openingFormat, shownIn } from "./viewerTime";

const at = (iso: string) => Date.parse(iso);
const KARACHI = "Asia/Karachi";

describe("a practitioner's slot on a visitor's clock", () => {
  const slot = { date: "2026-10-06", startTime: "10:00", endTime: "11:00" };

  it("shows the same slot at the visitor's own time, with a zone tag", () => {
    expect(shownIn(slot, KARACHI, "America/New_York")).toEqual({ date: "2026-10-06", startTime: "01:00", endTime: "02:00", zone: "America/New_York", tag: "EDT" });
    expect(shownIn(slot, KARACHI, "Europe/London")).toMatchObject({ startTime: "06:00", endTime: "07:00" });
    expect(shownIn(slot, KARACHI, "Asia/Kolkata")).toMatchObject({ startTime: "10:30", endTime: "11:30" });
  });

  it("changes nothing when the visitor is on the practitioner's clock", () => {
    expect(shownIn(slot, KARACHI, KARACHI)).toMatchObject({ date: "2026-10-06", startTime: "10:00", endTime: "11:00", tag: "PKT" });
  });

  it("moves the date when the visitor's clock is on the other side of midnight", () => {
    // 2 AM Tuesday in Karachi is the afternoon before in New York.
    const late = { date: "2026-10-06", startTime: "02:00", endTime: "03:00" };
    expect(shownIn(late, KARACHI, "America/New_York")).toMatchObject({ date: "2026-10-05", startTime: "17:00" });
    // And a late-evening slot in Karachi is already the next day for someone far ahead.
    const evening = { date: "2026-10-06", startTime: "22:00", endTime: "23:00" };
    expect(shownIn(evening, KARACHI, "Pacific/Auckland")).toMatchObject({ date: "2026-10-07" });
  });

  it("uses the offset in force on that day, so daylight saving is right", () => {
    // Same 10:00 in Karachi, a week either side of New York's clocks going back (1 Nov 2026).
    expect(shownIn({ date: "2026-10-27", startTime: "10:00", endTime: "11:00" }, KARACHI, "America/New_York")).toMatchObject({ startTime: "01:00", tag: "EDT" });
    expect(shownIn({ date: "2026-11-03", startTime: "10:00", endTime: "11:00" }, KARACHI, "America/New_York")).toMatchObject({ startTime: "00:00", tag: "EST" });
  });
});

describe("which clock a visitor sees", () => {
  it("follows the visitor for online sessions and the practitioner for sessions in person", () => {
    expect(displayZoneFor("online", KARACHI, "America/New_York")).toBe("America/New_York");
    expect(displayZoneFor("both", KARACHI, "America/New_York")).toBe("America/New_York");
    expect(displayZoneFor("offline", KARACHI, "America/New_York")).toBe(KARACHI);
  });
});

describe("slots that have already started", () => {
  const now = at("2026-10-06T05:00:00Z"); // 10:00 in Karachi
  const slots = [
    { id: "past", date: "2026-10-06", startTime: "09:00", endTime: "10:00" },
    { id: "now", date: "2026-10-06", startTime: "10:00", endTime: "11:00" },
    { id: "soon", date: "2026-10-06", startTime: "10:30", endTime: "11:30" },
    { id: "tomorrow", date: "2026-10-07", startTime: "09:00", endTime: "10:00" },
    { id: "yesterday", date: "2026-10-05", startTime: "15:00", endTime: "16:00" },
  ];

  it("are dropped, judged on the practitioner's clock", () => {
    expect(notStarted(slots, KARACHI, now).map((s) => s.id)).toEqual(["soon", "tomorrow"]);
  });

  it("depend on the practitioner's zone, not the visitor's", () => {
    // The same slot list and the same moment: in New York it is only 01:00, so almost nothing today has started.
    expect(notStarted(slots, "America/New_York", now).map((s) => s.id)).toEqual(["past", "now", "soon", "tomorrow"]);
  });

  it("gives the earliest slot still ahead", () => {
    expect(nextAvailable(slots, KARACHI, now)?.id).toBe("soon");
    expect(nextAvailable([], KARACHI, now)).toBeNull();
  });
});

describe("which format the booking window opens on", () => {
  const slot = (date: string, startTime: string, sessionType: "online" | "offline" | "both") => ({ date, startTime, endTime: "23:59", sessionType });
  const both = { online: true, offline: true };

  it("opens on the format of the earliest slot, so the date the bar names is on the first screen", () => {
    const slots = [slot("2031-05-12", "09:00", "online"), slot("2031-05-11", "11:00", "offline")];
    expect(openingFormat(slots, both)).toBe("offline");
    expect(openingFormat([slot("2031-05-11", "11:00", "online"), slot("2031-05-10", "09:00", "offline")], both)).toBe("offline");
  });

  it("opens a slot that fits either format on Online", () => {
    expect(openingFormat([slot("2031-05-11", "11:00", "both")], both)).toBe("online");
  });

  it("goes by the time of day on the same date", () => {
    expect(openingFormat([slot("2031-05-11", "15:00", "online"), slot("2031-05-11", "09:00", "offline")], both)).toBe("offline");
  });

  it("only ever picks a format that is offered", () => {
    expect(openingFormat([slot("2031-05-11", "09:00", "offline")], { online: true, offline: false })).toBe("online");
    expect(openingFormat([slot("2031-05-11", "09:00", "online")], { online: false, offline: true })).toBe("offline");
  });

  it("has nothing to pick when there are no slots and nothing offered", () => {
    expect(openingFormat([], { online: false, offline: false })).toBeNull();
    expect(openingFormat([], both)).toBe("online");
  });
});
