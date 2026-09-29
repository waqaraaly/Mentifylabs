import type { Slot, SlotStatus } from "@/types/slot";
import type { SlotSessionType } from "@/lib/sessionType";

/**
 * In-memory data source (module-level array). Swap the bodies below for
 * Cloudflare D1 queries once the schema exists — every function is async
 * on purpose so call sites never change.
 */
const SLOTS: Slot[] = [
  { id: "slot-1", practitionerSlug: "dr-ali", date: "2026-09-18", startTime: "10:00", endTime: "10:50", sessionType: "online", status: "open" },
  { id: "slot-2", practitionerSlug: "dr-ali", date: "2026-09-18", startTime: "14:00", endTime: "14:50", sessionType: "offline", status: "open" },
  { id: "slot-3", practitionerSlug: "dr-ali", date: "2026-09-19", startTime: "11:00", endTime: "11:50", sessionType: "online", status: "open" },
  { id: "slot-4", practitionerSlug: "dr-ali", date: "2026-09-20", startTime: "15:00", endTime: "15:50", sessionType: "online", status: "booked" },
  { id: "slot-5", practitionerSlug: "dr-ali", date: "2026-09-21", startTime: "09:00", endTime: "09:50", sessionType: "offline", status: "booked" },
  { id: "slot-6", practitionerSlug: "dr-ali", date: "2026-09-15", startTime: "17:00", endTime: "17:50", sessionType: "online", status: "booked" },
  { id: "slot-7", practitionerSlug: "dr-ali", date: "2026-09-24", startTime: "09:00", endTime: "09:50", sessionType: "both", status: "open" },
  { id: "slot-8", practitionerSlug: "dr-ali", date: "2026-09-24", startTime: "10:00", endTime: "10:50", sessionType: "offline", status: "open" },
  { id: "slot-9", practitionerSlug: "dr-ali", date: "2026-09-24", startTime: "11:30", endTime: "12:20", sessionType: "online", status: "booked" },
  { id: "slot-10", practitionerSlug: "dr-ali", date: "2026-09-24", startTime: "14:00", endTime: "14:50", sessionType: "online", status: "open" },
  { id: "slot-12", practitionerSlug: "dr-ali", date: "2026-09-25", startTime: "09:00", endTime: "09:50", sessionType: "offline", status: "open" },
  { id: "slot-13", practitionerSlug: "dr-ali", date: "2026-09-25", startTime: "11:00", endTime: "11:50", sessionType: "online", status: "open" },
  { id: "slot-14", practitionerSlug: "dr-ali", date: "2026-09-25", startTime: "13:00", endTime: "13:50", sessionType: "offline", status: "booked" },
  { id: "slot-15", practitionerSlug: "dr-ali", date: "2026-09-25", startTime: "15:00", endTime: "15:50", sessionType: "online", status: "open" },
  { id: "slot-16", practitionerSlug: "dr-ali", date: "2026-09-25", startTime: "17:00", endTime: "17:50", sessionType: "online", status: "open" },
  { id: "slot-17", practitionerSlug: "dr-ali", date: "2026-09-24", startTime: "16:00", endTime: "16:50", sessionType: "offline", status: "open" },
  { id: "slot-18", practitionerSlug: "dr-ali", date: "2026-09-24", startTime: "17:30", endTime: "18:20", sessionType: "both", status: "open" },
  { id: "slot-19", practitionerSlug: "dr-ali", date: "2026-09-26", startTime: "09:30", endTime: "10:20", sessionType: "online", status: "open" },
  { id: "slot-20", practitionerSlug: "dr-ali", date: "2026-09-26", startTime: "10:30", endTime: "11:20", sessionType: "both", status: "open" },
  { id: "slot-21", practitionerSlug: "dr-ali", date: "2026-09-26", startTime: "12:00", endTime: "12:50", sessionType: "offline", status: "booked" },
  { id: "slot-22", practitionerSlug: "dr-ali", date: "2026-09-26", startTime: "14:30", endTime: "15:20", sessionType: "online", status: "open" },
  { id: "slot-23", practitionerSlug: "dr-ali", date: "2026-09-26", startTime: "16:00", endTime: "16:50", sessionType: "online", status: "booked" },
  { id: "slot-24", practitionerSlug: "dr-ali", date: "2026-09-26", startTime: "17:00", endTime: "17:50", sessionType: "offline", status: "open" },
  { id: "slot-25", practitionerSlug: "dr-ali", date: "2026-10-05", startTime: "10:00", endTime: "10:50", sessionType: "online", status: "open" },
  { id: "slot-26", practitionerSlug: "dr-ali", date: "2026-10-05", startTime: "11:00", endTime: "11:50", sessionType: "both", status: "open" },
  { id: "slot-27", practitionerSlug: "dr-ali", date: "2026-10-05", startTime: "15:00", endTime: "15:50", sessionType: "offline", status: "open" },
  { id: "slot-28", practitionerSlug: "dr-ali", date: "2026-10-09", startTime: "09:00", endTime: "09:50", sessionType: "online", status: "open" },
  { id: "slot-29", practitionerSlug: "dr-ali", date: "2026-10-09", startTime: "10:00", endTime: "10:50", sessionType: "online", status: "open" },
  // Late-evening and midnight slots, to see how the calendar handles the edges of the day.
  { id: "slot-30", practitionerSlug: "dr-ali", date: "2026-09-24", startTime: "21:00", endTime: "21:50", sessionType: "offline", status: "booked" },
  { id: "slot-31", practitionerSlug: "dr-ali", date: "2026-09-25", startTime: "22:00", endTime: "22:50", sessionType: "online", status: "booked" },
  { id: "slot-32", practitionerSlug: "dr-ali", date: "2026-09-27", startTime: "00:00", endTime: "00:50", sessionType: "online", status: "booked" },
  { id: "slot-33", practitionerSlug: "dr-ali", date: "2026-09-26", startTime: "21:00", endTime: "21:50", sessionType: "both", status: "open" },
  { id: "slot-34", practitionerSlug: "dr-ali", date: "2026-09-26", startTime: "22:00", endTime: "22:50", sessionType: "online", status: "open" },
];

let nextId = Math.max(0, ...SLOTS.map((s) => Number(s.id.replace("slot-", "")))) + 1;

export async function getSlotsByPractitioner(slug: string): Promise<Slot[]> {
  return SLOTS.filter((s) => s.practitionerSlug === slug).sort((a, b) =>
    `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
  );
}

export async function getOpenSlotsByPractitioner(slug: string): Promise<Slot[]> {
  const all = await getSlotsByPractitioner(slug);
  return all.filter((s) => s.status === "open");
}

export async function getSlotById(id: string): Promise<Slot | null> {
  return SLOTS.find((s) => s.id === id) ?? null;
}

/** Whether a new [startTime, endTime) range on this date would overlap an existing slot (any status). */
export async function slotsOverlap(
  practitionerSlug: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
): Promise<boolean> {
  return SLOTS.some(
    (s) =>
      s.practitionerSlug === practitionerSlug &&
      s.date === date &&
      s.id !== excludeId &&
      s.startTime < endTime &&
      startTime < s.endTime,
  );
}

export async function addSlot(input: {
  practitionerSlug: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionType: SlotSessionType;
}): Promise<Slot> {
  const slot: Slot = { id: `slot-${nextId++}`, status: "open", ...input };
  SLOTS.push(slot);
  return slot;
}

export async function updateSlot(
  id: string,
  updates: Partial<Pick<Slot, "date" | "startTime" | "endTime" | "sessionType">>,
): Promise<Slot | null> {
  const slot = SLOTS.find((s) => s.id === id);
  if (!slot) return null;
  Object.assign(slot, updates);
  return slot;
}

export async function setSlotStatus(id: string, status: SlotStatus): Promise<void> {
  const slot = SLOTS.find((s) => s.id === id);
  if (slot) slot.status = status;
}

export async function deleteSlot(id: string): Promise<void> {
  const index = SLOTS.findIndex((s) => s.id === id);
  if (index !== -1) SLOTS.splice(index, 1);
}

/** Re-points a practitioner's slots at their new slug after a rename. */
export async function renameSlotSlug(from: string, to: string): Promise<void> {
  for (const s of SLOTS) if (s.practitionerSlug === from) s.practitionerSlug = to;
}
