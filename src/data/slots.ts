import type { Slot, SlotStatus } from "@/types/slot";
import type { SlotSessionType } from "@/lib/sessionType";
import { all, batch, first, prepare, run } from "@/lib/db";

interface SlotRow {
  id: string;
  practitioner_slug: string;
  date: string;
  start_time: string;
  end_time: string;
  session_type: SlotSessionType;
  status: SlotStatus;
}

function toSlot(r: SlotRow): Slot {
  return {
    id: r.id,
    practitionerSlug: r.practitioner_slug,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    sessionType: r.session_type,
    status: r.status,
  };
}

export async function getSlotsByPractitioner(slug: string): Promise<Slot[]> {
  const rows = await all<SlotRow>(
    "SELECT * FROM slots WHERE practitioner_slug = ? ORDER BY date, start_time",
    slug,
  );
  return rows.map(toSlot);
}

export async function getOpenSlotsByPractitioner(slug: string): Promise<Slot[]> {
  const rows = await all<SlotRow>(
    "SELECT * FROM slots WHERE practitioner_slug = ? AND status = 'open' ORDER BY date, start_time",
    slug,
  );
  return rows.map(toSlot);
}

/** An open slot on this date that overlaps [startTime, endTime), if any: a client could still book it. */
export async function openSlotOverlapping(practitionerSlug: string, date: string, startTime: string, endTime: string): Promise<Slot | null> {
  const row = await first<SlotRow>(
    "SELECT * FROM slots WHERE practitioner_slug = ? AND date = ? AND status = 'open' AND start_time < ? AND end_time > ? ORDER BY start_time LIMIT 1",
    practitionerSlug,
    date,
    endTime,
    startTime,
  );
  return row ? toSlot(row) : null;
}

export async function getSlotById(id: string): Promise<Slot | null> {
  const row = await first<SlotRow>("SELECT * FROM slots WHERE id = ?", id);
  return row ? toSlot(row) : null;
}

/** Whether a new [startTime, endTime) range on this date would overlap an existing slot (any status). */
export async function slotsOverlap(
  practitionerSlug: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
): Promise<boolean> {
  const row = await first(
    `SELECT 1 FROM slots
      WHERE practitioner_slug = ? AND date = ? AND start_time < ? AND end_time > ?
        AND (?5 IS NULL OR id <> ?5)
      LIMIT 1`,
    practitionerSlug,
    date,
    endTime,
    startTime,
    excludeId,
  );
  return row !== null;
}

type NewSlot = {
  practitionerSlug: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionType: SlotSessionType;
};

const INSERT_SLOT =
  "INSERT INTO slots (practitioner_slug, date, start_time, end_time, session_type, status) VALUES (?, ?, ?, ?, ?, 'open')";

export async function addSlot(input: NewSlot): Promise<Slot> {
  const row = await first<SlotRow>(
    INSERT_SLOT + " RETURNING *",
    input.practitionerSlug,
    input.date,
    input.startTime,
    input.endTime,
    input.sessionType,
  );
  return toSlot(row!);
}

/** Inserts many open slots in one transaction. */
export async function addSlots(inputs: NewSlot[]): Promise<void> {
  const statements = await Promise.all(
    inputs.map((s) => prepare(INSERT_SLOT, s.practitionerSlug, s.date, s.startTime, s.endTime, s.sessionType)),
  );
  await batch(statements);
}

export async function updateSlot(
  id: string,
  updates: Partial<Pick<Slot, "date" | "startTime" | "endTime" | "sessionType">>,
): Promise<Slot | null> {
  const row = await first<SlotRow>(
    `UPDATE slots SET
        date = COALESCE(?, date),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        session_type = COALESCE(?, session_type)
      WHERE id = ? RETURNING *`,
    updates.date,
    updates.startTime,
    updates.endTime,
    updates.sessionType,
    id,
  );
  return row ? toSlot(row) : null;
}

export async function setSlotStatus(id: string, status: SlotStatus): Promise<void> {
  await run("UPDATE slots SET status = ? WHERE id = ?", status, id);
}

export async function setSlotsStatus(ids: string[], status: SlotStatus): Promise<void> {
  const statements = await Promise.all(ids.map((id) => prepare("UPDATE slots SET status = ? WHERE id = ?", status, id)));
  await batch(statements);
}

export async function deleteSlot(id: string): Promise<void> {
  await run("DELETE FROM slots WHERE id = ?", id);
}
