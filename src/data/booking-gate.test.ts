import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// bookAppointment runs inside a web request. Outside one there are no headers and no page cache to refresh,
// so those two are replaced: each call gets its own network address (so the per-address limit never interferes).
let nextIp = 0;
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "cf-connecting-ip": `booking-gate-test-${nextIp}` }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));

import { run, first } from "@/lib/db";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { addSlot, getSlotById } from "./slots";
import { bookAppointment } from "@/app/[username]/actions";

let slug: string;
let slotId: string;

async function setState(fields: { status: string; profile_status: string; verification_status: string; accepting_bookings?: number }) {
  await run(
    "UPDATE practitioners SET status = ?, profile_status = ?, verification_status = ?, accepting_bookings = ? WHERE slug = ?",
    fields.status,
    fields.profile_status,
    fields.verification_status,
    fields.accepting_bookings ?? 1,
    slug,
  );
}

const booking = (id: string) => {
  const form = new FormData();
  form.set("slotId", id);
  form.set("fullName", "Booking Tester");
  form.set("contactNumber", "0300 1234567");
  form.set("concern", "Test booking");
  form.set("format", "online");
  return form;
};

const book = (id = slotId) => {
  nextIp += 1;
  return bookAppointment(slug, { status: "idle", message: "" }, booking(id));
};

const appointmentCount = async () =>
  (await first<{ n: number }>("SELECT count(*) AS n FROM appointments WHERE practitioner_slug = ?", slug))?.n ?? 0;

beforeEach(async () => {
  slug = await createTestPractitioner();
  slotId = (await addSlot({ practitionerSlug: slug, date: "2030-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" })).id;
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
  await run("DELETE FROM login_attempts WHERE email LIKE 'book:booking-gate-test-%'");
});

describe("nobody can book a profile that isn't public", () => {
  it("refuses a draft, even for a verified and active practitioner (the preview state)", async () => {
    await setState({ status: "active", profile_status: "draft", verification_status: "verified" });
    const result = await book();
    expect(result.status).toBe("error");
    expect(await appointmentCount()).toBe(0);
    expect((await getSlotById(slotId))?.status).toBe("open");
  });

  it("refuses a published profile whose credentials aren't verified", async () => {
    await setState({ status: "active", profile_status: "published", verification_status: "pending" });
    expect((await book()).status).toBe("error");
    expect(await appointmentCount()).toBe(0);
  });

  it("refuses a profile an admin took offline", async () => {
    await setState({ status: "active", profile_status: "hidden", verification_status: "verified" });
    expect((await book()).status).toBe("error");
    expect(await appointmentCount()).toBe(0);
  });

  it("refuses when the practitioner has paused bookings", async () => {
    await setState({ status: "active", profile_status: "published", verification_status: "verified", accepting_bookings: 0 });
    expect((await book()).status).toBe("error");
    expect(await appointmentCount()).toBe(0);
  });

  it("works once the profile is published, verified and active", async () => {
    await setState({ status: "active", profile_status: "published", verification_status: "verified" });
    const result = await book();
    expect(result.status).toBe("success");
    expect(await appointmentCount()).toBe(1);
    expect((await getSlotById(slotId))?.status).toBe("booked");
  });
});
