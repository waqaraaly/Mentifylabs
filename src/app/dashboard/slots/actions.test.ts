import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Whoever the test says is signed in, and no page cache: the real action and database run.
let signedInPractitionerId = "";
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  requireRole: async () => ({ practitionerId: signedInPractitionerId, role: "practitioner" }),
}));

import { all, first, run } from "@/lib/db";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { addWeeklyRuleAction, getConflictsAction, markSlotsUnavailableAction, updateWeeklyRuleAction } from "./actions";

let slug: string;
const rules = () =>
  all<{ weekday: number; start_time: string; end_time: string; session_type: string }>(
    "SELECT weekday, start_time, end_time, session_type FROM weekly_rules WHERE practitioner_slug = ? ORDER BY weekday, start_time",
    slug,
  );

function form(weekday: number, targets: (number | string)[] = [], start = "10:00", end = "10:50") {
  const data = new FormData();
  data.set("slug", slug);
  data.set("weekday", String(weekday));
  data.set("startTime", start);
  data.set("endTime", end);
  data.set("sessionType", "online");
  for (const t of targets) data.append("targets", String(t));
  return data;
}

beforeEach(async () => {
  slug = await createTestPractitioner();
  signedInPractitionerId = (await first<{ id: string }>("SELECT id FROM practitioners WHERE slug = ?", slug))!.id;
  await run("DELETE FROM weekly_rules WHERE practitioner_slug = ?", slug);
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
});

describe("adding a weekly slot", () => {
  it("adds just that day when no other days are chosen, as before", async () => {
    expect(await addWeeklyRuleAction(form(1))).toEqual({});
    expect((await rules()).map((r) => r.weekday)).toEqual([1]);
  });

  it("adds the same hours to every other day that was chosen", async () => {
    expect(await addWeeklyRuleAction(form(1, [2, 3, 5]))).toEqual({});
    const saved = await rules();
    expect(saved.map((r) => r.weekday)).toEqual([1, 2, 3, 5]);
    for (const r of saved) expect(r).toMatchObject({ start_time: "10:00", end_time: "10:50", session_type: "online" });
  });

  it("saves nothing at all when one chosen day already has overlapping hours, and names that day", async () => {
    await run("INSERT INTO weekly_rules (practitioner_slug, weekday, start_time, end_time, session_type) VALUES (?, 3, '10:30', '11:30', 'online')", slug);
    const result = await addWeeklyRuleAction(form(1, [2, 3]));
    expect(result.error).toMatch(/Wednesday/);
    expect((await rules()).map((r) => r.weekday)).toEqual([3]); // only the one that was already there
  });

  it("works again once the clashing day is unticked", async () => {
    await run("INSERT INTO weekly_rules (practitioner_slug, weekday, start_time, end_time, session_type) VALUES (?, 3, '10:30', '11:30', 'online')", slug);
    await addWeeklyRuleAction(form(1, [2, 3]));
    expect(await addWeeklyRuleAction(form(1, [2]))).toEqual({});
    expect((await rules()).map((r) => r.weekday)).toEqual([1, 2, 3]);
  });

  it("still refuses an overlap on the day itself", async () => {
    await addWeeklyRuleAction(form(1));
    const result = await addWeeklyRuleAction(form(1, [2]));
    expect(result.error).toBe("This overlaps with an existing slot on that day.");
    expect((await rules()).map((r) => r.weekday)).toEqual([1]);
  });

  it("ignores repeats, the day itself and days that don't exist", async () => {
    await addWeeklyRuleAction(form(1, [2, 2, 1, 9, -1, "x"]));
    expect((await rules()).map((r) => r.weekday)).toEqual([1, 2]);
  });
});

describe("saving a weekly slot with copies", () => {
  const idOf = async (weekday: number) =>
    (await first<{ id: string }>("SELECT id FROM weekly_rules WHERE practitioner_slug = ? AND weekday = ?", slug, weekday))!.id;
  const save = async (id: string, weekday: number, targets: number[], start = "10:00", end = "10:50") => {
    const data = form(weekday, targets, start, end);
    data.set("id", id);
    return updateWeeklyRuleAction(data);
  };

  it("adds the same hours to each chosen day when changes are saved", async () => {
    await addWeeklyRuleAction(form(1));
    expect(await save(await idOf(1), 1, [2, 4])).toEqual({});
    expect((await rules()).map((r) => r.weekday)).toEqual([1, 2, 4]);
  });

  it("copies the hours as edited, not as they were saved before", async () => {
    await addWeeklyRuleAction(form(1));
    await save(await idOf(1), 1, [2], "14:00", "14:50");
    expect(await rules()).toEqual([
      { weekday: 1, start_time: "14:00", end_time: "14:50", session_type: "online" },
      { weekday: 2, start_time: "14:00", end_time: "14:50", session_type: "online" },
    ]);
  });

  it("saves nothing, not even the edit, when a chosen day would overlap", async () => {
    await addWeeklyRuleAction(form(1));
    await run("INSERT INTO weekly_rules (practitioner_slug, weekday, start_time, end_time, session_type) VALUES (?, 3, '14:30', '15:30', 'online')", slug);
    const result = await save(await idOf(1), 1, [2, 3], "14:00", "14:50");
    expect(result.error).toMatch(/Wednesday/);
    expect(await rules()).toEqual([
      { weekday: 1, start_time: "10:00", end_time: "10:50", session_type: "online" },
      { weekday: 3, start_time: "14:30", end_time: "15:30", session_type: "online" },
    ]);
  });

  it("still saves a plain edit with no days chosen", async () => {
    await addWeeklyRuleAction(form(1));
    expect(await save(await idOf(1), 1, [], "11:00", "11:50")).toEqual({});
    expect(await rules()).toEqual([{ weekday: 1, start_time: "11:00", end_time: "11:50", session_type: "online" }]);
  });
});

describe("blocking chosen slots on one date", () => {
  const DATE = "2031-03-10";
  const add = async (start: string, status = "open", date = DATE, owner = slug) =>
    (await first<{ id: string }>(
      "INSERT INTO slots (practitioner_slug, date, start_time, end_time, session_type, status) VALUES (?, ?, ?, ?, 'online', ?) RETURNING id",
      owner, date, start, `${start.slice(0, 2)}:50`, status,
    ))!.id;
  const statuses = async () =>
    Object.fromEntries((await all<{ start_time: string; status: string }>("SELECT start_time, status FROM slots WHERE practitioner_slug = ? ORDER BY start_time", slug)).map((r) => [r.start_time, r.status]));

  it("blocks only the slots chosen and leaves the rest of the day open", async () => {
    const a = await add("09:00");
    await add("10:00");
    const c = await add("11:00");
    expect(await markSlotsUnavailableAction(slug, DATE, [a, c])).toEqual({ blocked: 2 });
    expect(await statuses()).toEqual({ "09:00": "unavailable", "10:00": "open", "11:00": "unavailable" });
  });

  it("makes the date a custom date, so the weekly hours stop refilling it", async () => {
    const a = await add("09:00");
    await markSlotsUnavailableAction(slug, DATE, [a]);
    const override = await first<{ type: string }>("SELECT type FROM day_overrides WHERE practitioner_slug = ? AND date = ?", slug, DATE);
    expect(override?.type).toBe("custom");
  });

  it("never touches a booked slot", async () => {
    const booked = await add("09:00", "booked");
    expect(await markSlotsUnavailableAction(slug, DATE, [booked])).toEqual({ blocked: 0 });
    expect(await statuses()).toEqual({ "09:00": "booked" });
  });

  it("ignores a slot from another date, and a slot that belongs to someone else", async () => {
    const otherDay = await add("09:00", "open", "2031-03-11");
    const other = await createTestPractitioner();
    try {
      const theirs = await add("09:00", "open", DATE, other);
      expect(await markSlotsUnavailableAction(slug, DATE, [otherDay, theirs])).toEqual({ blocked: 0 });
      expect((await first<{ status: string }>("SELECT status FROM slots WHERE id = ?", theirs))?.status).toBe("open");
    } finally {
      await deleteTestPractitioner(other);
    }
  });
});

describe("the sessions and requests a blocked day would leave in place", () => {
  it("says which are still requests and which are confirmed, and leaves out cancelled and completed ones", async () => {
    const DATE = "2031-04-01";
    const make = (start: string, status: string, name: string) =>
      run(
        "INSERT INTO appointments (client_id, practitioner_slug, client_name, client_contact, date, start_time, end_time, session_type, status) VALUES (?, ?, ?, '', ?, ?, ?, 'online', ?)",
        `CL-${start}${status}`, slug, name, DATE, start, `${start.slice(0, 2)}:50`, status,
      );
    await make("09:00", "pending", "Ayesha");
    await make("10:00", "confirmed", "Bilal");
    await make("11:00", "cancelled", "Hira");
    await make("12:00", "completed", "Usman");

    expect(await getConflictsAction(slug, [DATE])).toEqual([
      { date: DATE, startTime: "09:00", clientName: "Ayesha", status: "pending" },
      { date: DATE, startTime: "10:00", clientName: "Bilal", status: "confirmed" },
    ]);
  });
});
