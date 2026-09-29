import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import {
  addSlot,
  deleteSlot,
  getOpenSlotsByPractitioner,
  getSlotsByPractitioner,
  setSlotStatus,
  slotsOverlap,
  updateSlot,
} from "./slots";

let slug: string;

beforeEach(async () => {
  slug = await createTestPractitioner();
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
});

describe("slotsOverlap", () => {
  it("is false when there are no other slots that day", async () => {
    await expect(slotsOverlap(slug, "2026-10-01", "09:00", "10:00")).resolves.toBe(false);
  });

  it("is true for a slot that overlaps an existing one", async () => {
    await addSlot({ practitionerSlug: slug, date: "2026-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    await expect(slotsOverlap(slug, "2026-10-01", "09:30", "10:30")).resolves.toBe(true);
  });

  it("is false for a back-to-back slot that only touches the boundary", async () => {
    await addSlot({ practitionerSlug: slug, date: "2026-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    await expect(slotsOverlap(slug, "2026-10-01", "10:00", "11:00")).resolves.toBe(false);
  });

  it("ignores the slot itself when excludeId is given (editing in place)", async () => {
    const slot = await addSlot({ practitionerSlug: slug, date: "2026-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    await expect(slotsOverlap(slug, "2026-10-01", "09:00", "10:00", slot.id)).resolves.toBe(false);
  });

  it("doesn't leak across practitioners", async () => {
    const otherSlug = await createTestPractitioner();
    try {
      await addSlot({ practitionerSlug: otherSlug, date: "2026-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
      await expect(slotsOverlap(slug, "2026-10-01", "09:00", "10:00")).resolves.toBe(false);
    } finally {
      await deleteTestPractitioner(otherSlug);
    }
  });
});

describe("getOpenSlotsByPractitioner", () => {
  it("only returns slots with status 'open'", async () => {
    const open = await addSlot({ practitionerSlug: slug, date: "2026-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    const taken = await addSlot({ practitionerSlug: slug, date: "2026-10-01", startTime: "11:00", endTime: "12:00", sessionType: "online" });
    await setSlotStatus(taken.id, "booked");

    const result = await getOpenSlotsByPractitioner(slug);
    expect(result.map((s) => s.id)).toEqual([open.id]);
  });
});

describe("updateSlot / deleteSlot", () => {
  it("updates only the given fields", async () => {
    const slot = await addSlot({ practitionerSlug: slug, date: "2026-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    const updated = await updateSlot(slot.id, { startTime: "09:30" });
    expect(updated).toMatchObject({ id: slot.id, startTime: "09:30", endTime: "10:00", date: "2026-10-01" });
  });

  it("removes the slot", async () => {
    const slot = await addSlot({ practitionerSlug: slug, date: "2026-10-01", startTime: "09:00", endTime: "10:00", sessionType: "online" });
    await deleteSlot(slot.id);
    expect(await getSlotsByPractitioner(slug)).toEqual([]);
  });
});
