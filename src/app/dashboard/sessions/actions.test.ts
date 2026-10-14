import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Whoever the test says is signed in, and no page cache: the real actions and the real database run.
let signedInPractitionerId = "";
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  requireRole: async () => ({ practitionerId: signedInPractitionerId, role: "practitioner" }),
}));

import { all, first } from "@/lib/db";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { createManualAppointment, getAppointmentById } from "@/data/appointments";
import {
  approveAppointment,
  cancelAppointment,
  completeAppointment,
  declineAppointment,
  deleteAppointmentAction,
  rescheduleAppointmentAction,
  scheduleSessionAction,
} from "./actions";

let slug: string;
const FUTURE = "2031-05-05";
const PAST = "2020-05-05";

const slotStatus = async (id: string) => (await first<{ status: string }>("SELECT status FROM slots WHERE id = ?", id))?.status;
const statusOf = async (id: string) => (await getAppointmentById(id))?.status;
const makeSlot = async (start: string, date = FUTURE, status = "open") =>
  (await first<{ id: string }>(
    "INSERT INTO slots (practitioner_slug, date, start_time, end_time, session_type, status) VALUES (?, ?, ?, ?, 'online', ?) RETURNING id",
    slug, date, start, `${start.slice(0, 2)}:50`, status,
  ))!.id;
/** An appointment on a made-up time (it holds no slot), in any status, on any date. */
const makeAppointment = async (status: string, date = FUTURE, slotId: string | null = null) =>
  (await first<{ id: string }>(
    `INSERT INTO appointments (client_id, practitioner_slug, slot_id, client_name, client_contact, date, start_time, end_time, session_type, status)
     VALUES ('CL-' || abs(random() % 100000), ?, ?, 'Client', '', ?, '09:00', '09:50', 'online', ?) RETURNING id`,
    slug, slotId, date, status,
  ))!.id;
const form = (id: string, extra: Record<string, string> = {}) => {
  const data = new FormData();
  data.set("slug", slug);
  data.set("id", id);
  for (const [k, v] of Object.entries(extra)) data.set(k, v);
  return data;
};
const appointmentCount = async () => (await all("SELECT 1 FROM appointments WHERE practitioner_slug = ?", slug)).length;

beforeEach(async () => {
  slug = await createTestPractitioner();
  signedInPractitionerId = (await first<{ id: string }>("SELECT id FROM practitioners WHERE slug = ?", slug))!.id;
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
});

describe("moving an appointment to a new status", () => {
  it("accepts a pending request that is still ahead", async () => {
    const id = await makeAppointment("pending");
    await approveAppointment(form(id));
    expect(await statusOf(id)).toBe("confirmed");
  });

  it("will not confirm a request that was already cancelled, which would leave its slot open for someone else", async () => {
    const slot = await makeSlot("09:00");
    const appointment = (await createManualAppointment({ practitionerSlug: slug, clientName: "A", clientContact: "", slotId: slot }))!;
    await cancelAppointment(form(appointment.id));
    expect(await slotStatus(slot)).toBe("open");

    await approveAppointment(form(appointment.id));
    expect(await statusOf(appointment.id)).toBe("cancelled");
    expect(await slotStatus(slot)).toBe("open");
  });

  it("will not accept a request whose time has already gone, but it can still be declined", async () => {
    const id = await makeAppointment("pending", PAST);
    await approveAppointment(form(id));
    expect(await statusOf(id)).toBe("pending");
    await declineAppointment(form(id));
    expect(await statusOf(id)).toBe("cancelled");
  });

  it("completes a confirmed session that has started, and not one that is still ahead or never confirmed", async () => {
    const done = await makeAppointment("confirmed", PAST);
    const ahead = await makeAppointment("confirmed", FUTURE);
    const unanswered = await makeAppointment("pending", PAST);
    await completeAppointment(form(done));
    await completeAppointment(form(ahead));
    await completeAppointment(form(unanswered));
    expect(await statusOf(done)).toBe("completed");
    expect(await statusOf(ahead)).toBe("confirmed");
    expect(await statusOf(unanswered)).toBe("pending");
  });

  it("cancelling frees the slot, but only for an appointment that is still live", async () => {
    const live = await makeSlot("09:00");
    const liveAppointment = (await createManualAppointment({ practitionerSlug: slug, clientName: "A", clientContact: "", slotId: live }))!;
    await cancelAppointment(form(liveAppointment.id));
    expect(await statusOf(liveAppointment.id)).toBe("cancelled");
    expect(await slotStatus(live)).toBe("open");

    const held = await makeSlot("10:00", PAST, "booked");
    const finished = await makeAppointment("completed", PAST, held);
    await cancelAppointment(form(finished));
    expect(await statusOf(finished)).toBe("completed");
    expect(await slotStatus(held)).toBe("booked");
  });
});

describe("deleting a record", () => {
  it("deletes one that is over, and frees any slot it still pointed at", async () => {
    const cancelled = await makeAppointment("cancelled");
    await deleteAppointmentAction(form(cancelled));
    expect(await getAppointmentById(cancelled)).toBeNull();

    const slot = await makeSlot("09:00", PAST, "booked");
    const completed = await makeAppointment("completed", PAST, slot);
    await deleteAppointmentAction(form(completed));
    expect(await getAppointmentById(completed)).toBeNull();
    expect(await slotStatus(slot)).toBe("open");
  });

  it("refuses to delete a live appointment, so its slot is never left booked with nothing behind it", async () => {
    const slot = await makeSlot("09:00");
    const appointment = (await createManualAppointment({ practitionerSlug: slug, clientName: "A", clientContact: "", slotId: slot }))!;
    const pending = await makeAppointment("pending");
    await deleteAppointmentAction(form(appointment.id));
    await deleteAppointmentAction(form(pending));
    expect(await statusOf(appointment.id)).toBe("confirmed");
    expect(await statusOf(pending)).toBe("pending");
    expect(await slotStatus(slot)).toBe("booked");
  });
});

describe("rescheduling", () => {
  it("moves a live appointment to a free slot and frees the old one", async () => {
    const from = await makeSlot("09:00");
    const to = await makeSlot("10:00");
    const appointment = (await createManualAppointment({ practitionerSlug: slug, clientName: "A", clientContact: "", slotId: from }))!;
    expect(await rescheduleAppointmentAction(form(appointment.id, { slotId: to }))).toEqual({});
    expect(await slotStatus(from)).toBe("open");
    expect(await slotStatus(to)).toBe("booked");
  });

  it("will not move a cancelled appointment, which would hold a new slot for nothing", async () => {
    const from = await makeSlot("09:00");
    const to = await makeSlot("10:00");
    const appointment = (await createManualAppointment({ practitionerSlug: slug, clientName: "A", clientContact: "", slotId: from }))!;
    await cancelAppointment(form(appointment.id));
    const result = await rescheduleAppointmentAction(form(appointment.id, { slotId: to }));
    expect(result.error).toBeTruthy();
    expect(await slotStatus(to)).toBe("open");
    expect(await statusOf(appointment.id)).toBe("cancelled");
  });

  it("refuses a made-up time that overlaps the slot the appointment is leaving, which would open up under it", async () => {
    const held = await makeSlot("09:00");
    const appointment = (await createManualAppointment({ practitionerSlug: slug, clientName: "A", clientContact: "", slotId: held }))!;
    const result = await rescheduleAppointmentAction(form(appointment.id, { date: FUTURE, startTime: "09:10", endTime: "10:00", sessionType: "online" }));
    expect(result.error).toMatch(/overlaps one of your open slots/);
    expect(await slotStatus(held)).toBe("booked");
  });

  it("moves to a made-up time that clashes with nothing", async () => {
    const held = await makeSlot("09:00");
    const appointment = (await createManualAppointment({ practitionerSlug: slug, clientName: "A", clientContact: "", slotId: held }))!;
    expect(await rescheduleAppointmentAction(form(appointment.id, { date: FUTURE, startTime: "14:00", endTime: "14:50", sessionType: "online" }))).toEqual({});
    expect(await slotStatus(held)).toBe("open");
  });
});

describe("scheduling a session by hand", () => {
  const schedule = (extra: Record<string, string>) => scheduleSessionAction(form("x", { clientName: "Walk-in", sessionType: "online", ...extra }));

  it("takes a chosen open slot", async () => {
    const slot = await makeSlot("09:00");
    expect(await schedule({ slotId: slot })).toEqual({});
    expect(await slotStatus(slot)).toBe("booked");
  });

  it("refuses a made-up time that sits on an open slot a client could still book, and says why", async () => {
    const slot = await makeSlot("09:00");
    const result = await schedule({ date: FUTURE, startTime: "09:30", endTime: "10:20" });
    expect(result.error).toMatch(/overlaps one of your open slots/);
    expect(await appointmentCount()).toBe(0);
    expect(await slotStatus(slot)).toBe("open");
  });

  it("allows a made-up time that touches no open slot, and one that overlaps a slot that is blocked or already booked", async () => {
    await makeSlot("09:00", FUTURE, "unavailable");
    await makeSlot("11:00", FUTURE, "booked");
    expect(await schedule({ date: FUTURE, startTime: "09:00", endTime: "09:50" })).toEqual({});
    expect(await schedule({ date: FUTURE, startTime: "13:00", endTime: "13:50" })).toEqual({});
    expect(await appointmentCount()).toBe(2);
  });

  it("explains itself when the details are missing instead of closing as if it worked", async () => {
    expect((await schedule({ date: FUTURE, startTime: "10:00", endTime: "09:00" })).error).toBeTruthy();
    expect((await schedule({ clientName: "", date: FUTURE, startTime: "10:00", endTime: "11:00" })).error).toBeTruthy();
    expect(await appointmentCount()).toBe(0);
  });
});
