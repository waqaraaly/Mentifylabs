import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "@/lib/db";
import { createManualAppointment } from "@/data/appointments";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { getProfileStats } from "./profileStats";

const DAY = 24 * 60 * 60 * 1000;
const dayAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString().slice(0, 10);

let slug: string;

const view = (daysAgo: number, visitor = `v${Math.random()}`) =>
  run("INSERT INTO profile_views (practitioner_slug, day, visitor, source, device) VALUES (?, ?, ?, 'direct', 'desktop')", slug, dayAgo(daysAgo), visitor);

beforeEach(async () => {
  slug = await createTestPractitioner();
  await run("UPDATE practitioners SET date_joined = ? WHERE slug = ?", dayAgo(1), slug);
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
});

describe("stats for all time", () => {
  it("counts views from before the fixed ranges reach, which a range of 90 days leaves out", async () => {
    await view(200);
    await view(5);
    await view(0);

    expect((await getProfileStats(slug, 90)).views).toBe(2);
    const all = await getProfileStats(slug, "all");
    expect(all.views).toBe(3);
    expect(all.allTime).toBe(true);
  });

  it("starts on the day of the first view, with a point for every day since", async () => {
    await view(200);
    await view(0);
    const all = await getProfileStats(slug, "all");

    expect(all.range).toBe(201); // 200 days ago through today
    expect(all.daily).toHaveLength(201);
    expect(all.daily[0].day).toBe(dayAgo(200));
    expect(all.daily[0].views).toBe(1);
    expect(all.daily[200].day).toBe(dayAgo(0));
    expect(all.daily[100].views).toBe(0); // quiet days are zero, not missing
  });

  it("has no previous period to compare with, even when there were views before the usual comparison window", async () => {
    await view(100); // falls in the 90 days before "the last 90 days"
    await view(5);

    expect((await getProfileStats(slug, 90)).previousViews).toBe(1);
    const all = await getProfileStats(slug, "all");
    expect(all.previousViews).toBe(0);
    expect(all.previousVisitors).toBe(0);
  });

  it("counts appointment requests from the whole history too", async () => {
    const appointment = await createManualAppointment({ practitionerSlug: slug, clientName: "Ali", clientContact: "", date: dayAgo(150), startTime: "10:00", endTime: "11:00", sessionType: "online" });
    await run("UPDATE appointments SET created_at = ? WHERE id = ?", `${dayAgo(150)}T10:00:00.000Z`, appointment!.id);
    await view(150);

    expect((await getProfileStats(slug, 90)).bookingRequests).toBe(0);
    expect((await getProfileStats(slug, "all")).bookingRequests).toBe(1);
  });

  it("starts from when they joined if they have no views, and is never shorter than a week", async () => {
    await run("UPDATE practitioners SET date_joined = ? WHERE slug = ?", dayAgo(400), slug);
    const old = await getProfileStats(slug, "all");
    expect(old).toMatchObject({ range: 401, views: 0 });

    await run("UPDATE practitioners SET date_joined = ? WHERE slug = ?", dayAgo(0), slug);
    const fresh = await getProfileStats(slug, "all");
    expect(fresh.range).toBe(7);
    expect(fresh.daily).toHaveLength(7);
  });

  it("never looks back further than ten years", async () => {
    await run("UPDATE practitioners SET date_joined = ? WHERE slug = ?", dayAgo(5000), slug);
    expect((await getProfileStats(slug, "all")).range).toBe(3650);
  });

  it("leaves the fixed ranges exactly as they were", async () => {
    await view(3);
    const week = await getProfileStats(slug, 7);
    expect(week).toMatchObject({ range: 7, allTime: false, views: 1 });
    expect(week.daily).toHaveLength(7);
  });
});
