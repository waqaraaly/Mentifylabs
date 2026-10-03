import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { addSlot, getSlotById } from "./slots";
import {
  createAppointmentFromSlot,
  createManualAppointment,
  rescheduleAppointment,
  setAppointmentStatus,
} from "./appointments";

let slug: string;

beforeEach(async () => {
  slug = await createTestPractitioner();
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
});

describe("createAppointmentFromSlot", () => {
  it("books an open slot and marks it booked", async () => {
    const slot = await addSlot({ practitionerSlug: slug, date: "2030-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });

    const appt = await createAppointmentFromSlot({ practitionerSlug: slug, slotId: slot.id, clientName: "Ali", clientContact: "ali@example.com" });

    expect(appt).toMatchObject({ slotId: slot.id, status: "pending", clientName: "Ali" });
    expect((await getSlotById(slot.id))?.status).toBe("booked");
  });

  it("refuses to double-book an already-taken slot", async () => {
    const slot = await addSlot({ practitionerSlug: slug, date: "2030-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });

    const first = await createAppointmentFromSlot({ practitionerSlug: slug, slotId: slot.id, clientName: "Ali", clientContact: "ali@example.com" });
    const second = await createAppointmentFromSlot({ practitionerSlug: slug, slotId: slot.id, clientName: "Sara", clientContact: "sara@example.com" });

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it("survives concurrent booking attempts on the same slot — exactly one wins", async () => {
    const slot = await addSlot({ practitionerSlug: slug, date: "2030-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        createAppointmentFromSlot({ practitionerSlug: slug, slotId: slot.id, clientName: `Client ${i}`, clientContact: `c${i}@example.com` }),
      ),
    );

    expect(results.filter((r) => r !== null)).toHaveLength(1);
  });

  it("refuses a slot that belongs to a different practitioner", async () => {
    const other = await createTestPractitioner();
    try {
      const slot = await addSlot({ practitionerSlug: other, date: "2030-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });

      const appt = await createAppointmentFromSlot({ practitionerSlug: slug, slotId: slot.id, clientName: "Ali", clientContact: "ali@example.com" });

      expect(appt).toBeNull();
      // The refused booking must leave the slot open.
      expect((await getSlotById(slot.id))?.status).toBe("open");
    } finally {
      await deleteTestPractitioner(other);
    }
  });

  it("refuses a slot whose date has already passed", async () => {
    const slot = await addSlot({ practitionerSlug: slug, date: "2020-01-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });

    const appt = await createAppointmentFromSlot({ practitionerSlug: slug, slotId: slot.id, clientName: "Ali", clientContact: "ali@example.com" });

    expect(appt).toBeNull();
    expect((await getSlotById(slot.id))?.status).toBe("open");
  });

  it("returns null for a slot that doesn't exist", async () => {
    await expect(
      createAppointmentFromSlot({ practitionerSlug: slug, slotId: "slot-doesnotexist", clientName: "Ali", clientContact: "ali@example.com" }),
    ).resolves.toBeNull();
  });
});

describe("createManualAppointment", () => {
  it("lands straight in 'confirmed' when booking an open slot", async () => {
    const slot = await addSlot({ practitionerSlug: slug, date: "2030-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });

    const appt = await createManualAppointment({
      practitionerSlug: slug,
      clientName: "Walk-in",
      clientContact: "walkin@example.com",
      slotId: slot.id,
    });

    expect(appt?.status).toBe("confirmed");
  });

  it("creates a slot-less 'confirmed' appointment for a phone booking", async () => {
    const appt = await createManualAppointment({
      practitionerSlug: slug,
      clientName: "Phone booking",
      clientContact: "+92 300 0000000",
      date: "2026-10-02",
      startTime: "14:00",
      endTime: "15:00",
      sessionType: "offline",
    });

    expect(appt).toMatchObject({ slotId: null, status: "confirmed", sessionType: "offline" });
  });
});

describe("setAppointmentStatus", () => {
  it("cancelling releases the held slot back to 'open'", async () => {
    const slot = await addSlot({ practitionerSlug: slug, date: "2030-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    const appt = await createAppointmentFromSlot({ practitionerSlug: slug, slotId: slot.id, clientName: "Ali", clientContact: "ali@example.com" });

    await setAppointmentStatus(appt!.id, "cancelled");

    expect((await getSlotById(slot.id))?.status).toBe("open");
  });

  it("a cancelled appointment's old slot can be booked again", async () => {
    const slot = await addSlot({ practitionerSlug: slug, date: "2030-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    const first = await createAppointmentFromSlot({ practitionerSlug: slug, slotId: slot.id, clientName: "Ali", clientContact: "ali@example.com" });
    await setAppointmentStatus(first!.id, "cancelled");

    const second = await createAppointmentFromSlot({ practitionerSlug: slug, slotId: slot.id, clientName: "Sara", clientContact: "sara@example.com" });

    expect(second).not.toBeNull();
  });

  it("confirming doesn't touch the slot", async () => {
    const slot = await addSlot({ practitionerSlug: slug, date: "2030-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    const appt = await createAppointmentFromSlot({ practitionerSlug: slug, slotId: slot.id, clientName: "Ali", clientContact: "ali@example.com" });

    await setAppointmentStatus(appt!.id, "confirmed");

    expect((await getSlotById(slot.id))?.status).toBe("booked");
  });
});

describe("rescheduleAppointment", () => {
  it("moving to a new slot frees the old one and books the new one", async () => {
    const oldSlot = await addSlot({ practitionerSlug: slug, date: "2030-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    const newSlot = await addSlot({ practitionerSlug: slug, date: "2026-10-02", startTime: "11:00", endTime: "12:00", sessionType: "online" });
    const appt = await createAppointmentFromSlot({ practitionerSlug: slug, slotId: oldSlot.id, clientName: "Ali", clientContact: "ali@example.com" });

    const rescheduled = await rescheduleAppointment(appt!.id, { slotId: newSlot.id });

    expect(rescheduled).toMatchObject({ slotId: newSlot.id, date: "2026-10-02", startTime: "11:00" });
    expect((await getSlotById(oldSlot.id))?.status).toBe("open");
    expect((await getSlotById(newSlot.id))?.status).toBe("booked");
  });

  it("moving to a free-form time clears slot_id", async () => {
    const oldSlot = await addSlot({ practitionerSlug: slug, date: "2030-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    const appt = await createAppointmentFromSlot({ practitionerSlug: slug, slotId: oldSlot.id, clientName: "Ali", clientContact: "ali@example.com" });

    const rescheduled = await rescheduleAppointment(appt!.id, {
      date: "2026-10-05",
      startTime: "16:00",
      endTime: "17:00",
      sessionType: "offline",
    });

    expect(rescheduled).toMatchObject({ slotId: null, date: "2026-10-05", sessionType: "offline" });
    expect((await getSlotById(oldSlot.id))?.status).toBe("open");
  });

  it("refuses to move onto a slot another client already holds", async () => {
    const mine = await addSlot({ practitionerSlug: slug, date: "2030-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    const taken = await addSlot({ practitionerSlug: slug, date: "2030-10-02", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    const appt = await createAppointmentFromSlot({ practitionerSlug: slug, slotId: mine.id, clientName: "Ali", clientContact: "ali@example.com" });
    await createAppointmentFromSlot({ practitionerSlug: slug, slotId: taken.id, clientName: "Sara", clientContact: "sara@example.com" });

    await expect(rescheduleAppointment(appt!.id, { slotId: taken.id })).resolves.toBeNull();
    expect((await getSlotById(mine.id))?.status).toBe("booked");
  });

  it("returns null for an appointment that doesn't exist", async () => {
    await expect(
      rescheduleAppointment("appt-doesnotexist", { date: "2026-10-05", startTime: "16:00", endTime: "17:00", sessionType: "offline" }),
    ).resolves.toBeNull();
  });
});
