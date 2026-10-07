import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { first, run } from "@/lib/db";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { addDays } from "@/lib/format";
import { todayIn } from "@/lib/time";
import { addWeeklyRule, generateUpcomingSlots } from "./availability";
import { addSlot } from "./slots";
import { createAppointmentFromSlot, createManualAppointment, setAppointmentStatus } from "./appointments";
import { getPractitionerBySlug } from "./practitioners";
import { changePractitionerTimezone, upcomingSessionCount } from "./timezone";
import { STATUS_MOVES } from "@/lib/appointmentRules";

// Two zones 25 hours apart: whatever the moment, a calendar date is further along in the first than in the second.
const EARLY = "Pacific/Kiritimati"; // UTC+14
const LATE = "Pacific/Pago_Pago"; // UTC-11

let slug: string;
const setZone = (zone: string) => run("UPDATE practitioners SET timezone = ? WHERE slug = ?", zone, slug);

beforeEach(async () => {
  slug = await createTestPractitioner();
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
});

describe("a practitioner's time zone", () => {
  it("starts on the platform default, and is read back as a real zone", async () => {
    expect((await getPractitionerBySlug(slug))?.timezone).toBe("Asia/Karachi");
    await setZone("America/New_York");
    expect((await getPractitionerBySlug(slug))?.timezone).toBe("America/New_York");
  });

  it("falls back to the default if a bad value is ever stored", async () => {
    await setZone("Not/AZone");
    expect((await getPractitionerBySlug(slug))?.timezone).toBe("Asia/Karachi");
  });
});

describe("changing the zone", () => {
  it("saves a real zone", async () => {
    expect(await changePractitionerTimezone(slug, "Europe/London")).toEqual({ ok: true });
    expect((await getPractitionerBySlug(slug))?.timezone).toBe("Europe/London");
  });

  it("refuses something that isn't a zone, and changes nothing", async () => {
    for (const bad of ["", "Karachi", "UTC+5", "PKT", "Mars/Base"]) {
      expect(await changePractitionerTimezone(slug, bad)).toMatchObject({ ok: false, message: expect.stringMatching(/from the list/i) });
    }
    expect((await getPractitionerBySlug(slug))?.timezone).toBe("Asia/Karachi");
  });

  it("is refused while a session is still ahead, so no booked time changes meaning", async () => {
    const tomorrow = addDays(todayIn("Asia/Karachi"), 1);
    await createManualAppointment({ practitionerSlug: slug, clientName: "Ali", clientContact: "", date: tomorrow, startTime: "10:00", endTime: "11:00", sessionType: "online" });

    expect(await upcomingSessionCount(slug, "Asia/Karachi")).toBe(1);
    expect(await changePractitionerTimezone(slug, "America/New_York")).toMatchObject({
      ok: false,
      message: expect.stringMatching(/1 upcoming session\. Complete or cancel it first/),
    });
    expect((await getPractitionerBySlug(slug))?.timezone).toBe("Asia/Karachi");
  });

  it("is allowed again once those sessions are done or cancelled", async () => {
    const tomorrow = addDays(todayIn("Asia/Karachi"), 1);
    const a = await createManualAppointment({ practitionerSlug: slug, clientName: "Ali", clientContact: "", date: tomorrow, startTime: "10:00", endTime: "11:00", sessionType: "online" });
    const b = await createManualAppointment({ practitionerSlug: slug, clientName: "Sara", clientContact: "", date: tomorrow, startTime: "12:00", endTime: "13:00", sessionType: "online" });
    await setAppointmentStatus(a!.id, "cancelled", STATUS_MOVES.cancelled);
    await setAppointmentStatus(b!.id, "completed", STATUS_MOVES.completed);

    expect(await upcomingSessionCount(slug, "Asia/Karachi")).toBe(0);
    expect(await changePractitionerTimezone(slug, "America/New_York")).toEqual({ ok: true });
  });

  it("a session that has already gone by does not block it", async () => {
    const yesterday = addDays(todayIn("Asia/Karachi"), -1);
    await createManualAppointment({ practitionerSlug: slug, clientName: "Ali", clientContact: "", date: yesterday, startTime: "10:00", endTime: "11:00", sessionType: "online" });

    expect(await upcomingSessionCount(slug, "Asia/Karachi")).toBe(0);
    expect(await changePractitionerTimezone(slug, "America/New_York")).toEqual({ ok: true });
  });
});

describe("booking checks use the practitioner's clock", () => {
  it("the same slot is already over on an early clock and still ahead on a late one", async () => {
    // The first moment of "today" on the early clock. It has started there, but it is a day or more ahead on the late clock.
    const date = todayIn(EARLY);
    await setZone(EARLY);
    const early = await addSlot({ practitionerSlug: slug, date, startTime: "00:00", endTime: "01:00", sessionType: "online" });
    expect(await createAppointmentFromSlot({ practitionerSlug: slug, slotId: early.id, clientName: "Ali", clientContact: "ali@example.com" })).toBeNull();

    await setZone(LATE);
    const late = await addSlot({ practitionerSlug: slug, date, startTime: "00:00", endTime: "01:00", sessionType: "online" });
    expect(await createAppointmentFromSlot({ practitionerSlug: slug, slotId: late.id, clientName: "Ali", clientContact: "ali@example.com" })).toMatchObject({ status: "pending" });
  });

  it("refuses a slot from yesterday and accepts one tomorrow, on the practitioner's own clock", async () => {
    const today = todayIn("Asia/Karachi");
    const yesterday = await addSlot({ practitionerSlug: slug, date: addDays(today, -1), startTime: "10:00", endTime: "11:00", sessionType: "online" });
    const tomorrow = await addSlot({ practitionerSlug: slug, date: addDays(today, 1), startTime: "10:00", endTime: "11:00", sessionType: "online" });

    expect(await createAppointmentFromSlot({ practitionerSlug: slug, slotId: yesterday.id, clientName: "Ali", clientContact: "ali@example.com" })).toBeNull();
    expect(await createAppointmentFromSlot({ practitionerSlug: slug, slotId: tomorrow.id, clientName: "Ali", clientContact: "ali@example.com" })).toMatchObject({ status: "pending" });
  });
});

describe("filling slots from the weekly hours", () => {
  it("starts from today on the practitioner's clock", async () => {
    for (let weekday = 0; weekday < 7; weekday++) await addWeeklyRule(slug, weekday, { startTime: "09:00", endTime: "10:00", sessionType: "online" });

    for (const zone of [EARLY, LATE]) {
      await run("DELETE FROM slots WHERE practitioner_slug = ?", slug);
      await setZone(zone);
      await generateUpcomingSlots(slug);
      const earliest = await first<{ d: string }>("SELECT min(date) AS d FROM slots WHERE practitioner_slug = ?", slug);
      expect(earliest?.d).toBe(todayIn(zone));
    }
    // The two clocks really are on different dates, so this test can't pass by accident.
    expect(todayIn(EARLY)).not.toBe(todayIn(LATE));
  });
});
