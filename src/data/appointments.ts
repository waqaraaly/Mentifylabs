import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { BookedSessionType } from "@/lib/sessionType";
import { all, batch, first, prepare, run } from "@/lib/db";
import { getSlotById } from "./slots";

interface AppointmentRow {
  id: string;
  client_id: string;
  practitioner_slug: string;
  slot_id: string | null;
  client_name: string;
  client_contact: string;
  concern: string | null;
  date: string;
  start_time: string;
  end_time: string;
  session_type: "online" | "offline";
  status: AppointmentStatus;
  created_at: string;
}

function toAppointment(r: AppointmentRow): Appointment {
  return {
    id: r.id,
    clientId: r.client_id,
    practitionerSlug: r.practitioner_slug,
    slotId: r.slot_id,
    clientName: r.client_name,
    clientContact: r.client_contact,
    concern: r.concern ?? undefined,
    date: r.date,
    startTime: r.start_time,
    endTime: r.end_time,
    sessionType: r.session_type,
    status: r.status,
    createdAt: r.created_at,
  };
}

/** The next client id ("CL-1020", "CL-1021", …). D1 runs writes one at a time, so this can't race. */
const NEXT_CLIENT_ID =
  "(SELECT 'CL-' || (COALESCE(MAX(CAST(substr(client_id, 4) AS INTEGER)), 1019) + 1) FROM appointments)";

function firstRow(result: D1Result | undefined): Appointment | null {
  const row = result?.results?.[0] as AppointmentRow | undefined;
  return row ? toAppointment(row) : null;
}

/** Frees the slot an appointment currently holds, if any. */
const releaseHeldSlot = (appointmentId: string) =>
  prepare("UPDATE slots SET status = 'open' WHERE id = (SELECT slot_id FROM appointments WHERE id = ?)", appointmentId);

export async function getAppointmentsByPractitioner(
  slug: string,
  status?: AppointmentStatus,
): Promise<Appointment[]> {
  const rows = await all<AppointmentRow>(
    `SELECT * FROM appointments
      WHERE practitioner_slug = ? AND (?2 IS NULL OR status = ?2)
      ORDER BY created_at DESC`,
    slug,
    status,
  );
  return rows.map(toAppointment);
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const row = await first<AppointmentRow>("SELECT * FROM appointments WHERE id = ?", id);
  return row ? toAppointment(row) : null;
}

// ---- Super Admin ----

export async function getAllAppointments(): Promise<Appointment[]> {
  const rows = await all<AppointmentRow>("SELECT * FROM appointments ORDER BY created_at DESC");
  return rows.map(toAppointment);
}

/**
 * Books an open slot and creates its appointment in one transaction. Returns null if the
 * slot isn't open (already taken, blocked or gone), so two clients can never book the same slot.
 */
async function bookSlot(input: {
  slotId: string;
  clientName: string;
  clientContact: string;
  concern?: string;
  sessionType?: BookedSessionType;
  status: AppointmentStatus;
}): Promise<Appointment | null> {
  const [inserted] = await batch([
    await prepare(
      `INSERT INTO appointments
         (client_id, practitioner_slug, slot_id, client_name, client_contact, concern,
          date, start_time, end_time, session_type, status)
       SELECT ${NEXT_CLIENT_ID}, s.practitioner_slug, s.id, ?, ?, ?,
              s.date, s.start_time, s.end_time,
              CASE WHEN s.session_type = 'both' THEN COALESCE(?, 'online') ELSE s.session_type END, ?
         FROM slots s
        WHERE s.id = ? AND s.status = 'open'
       RETURNING *`,
      input.clientName,
      input.clientContact,
      input.concern,
      input.sessionType,
      input.status,
      input.slotId,
    ),
    await prepare("UPDATE slots SET status = 'booked' WHERE id = ? AND status = 'open'", input.slotId),
  ]);
  return firstRow(inserted);
}

export async function createAppointmentFromSlot(input: {
  slotId: string;
  clientName: string;
  clientContact: string;
  concern?: string;
  /** The format the client picked — only used when the slot offers both. */
  sessionType?: BookedSessionType;
}): Promise<Appointment | null> {
  return bookSlot({ ...input, status: "pending" });
}

/** Practitioner manually scheduling a session on a client's behalf (phone/walk-in booking) —
 * lands straight in "confirmed" since it never needs the practitioner's own approval. */
export async function createManualAppointment(
  input: {
    practitionerSlug: string;
    clientName: string;
    clientContact: string;
  } & (
    | { slotId: string; sessionType?: BookedSessionType }
    | { date: string; startTime: string; endTime: string; sessionType: "online" | "offline" }
  ),
): Promise<Appointment | null> {
  if ("slotId" in input) {
    return bookSlot({
      slotId: input.slotId,
      clientName: input.clientName,
      clientContact: input.clientContact,
      sessionType: input.sessionType,
      status: "confirmed",
    });
  }

  const row = await first<AppointmentRow>(
    `INSERT INTO appointments
       (client_id, practitioner_slug, slot_id, client_name, client_contact, date, start_time, end_time, session_type, status)
     VALUES (${NEXT_CLIENT_ID}, ?, NULL, ?, ?, ?, ?, ?, ?, 'confirmed')
     RETURNING *`,
    input.practitionerSlug,
    input.clientName,
    input.clientContact,
    input.date,
    input.startTime,
    input.endTime,
    input.sessionType,
  );
  return row ? toAppointment(row) : null;
}

export async function deleteAppointment(id: string): Promise<void> {
  await run("DELETE FROM appointments WHERE id = ?", id);
}

/** Cancelling or declining also releases the held slot back to the public calendar. */
export async function setAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment | null> {
  const statements = [
    ...(status === "cancelled" ? [await releaseHeldSlot(id)] : []),
    await prepare("UPDATE appointments SET status = ? WHERE id = ? RETURNING *", status, id),
  ];
  const results = await batch(statements);
  return firstRow(results[results.length - 1]);
}

export async function rescheduleAppointment(
  id: string,
  next: { slotId: string } | { date: string; startTime: string; endTime: string; sessionType: "online" | "offline" },
): Promise<Appointment | null> {
  if (!(await getAppointmentById(id))) return null;

  if ("slotId" in next) {
    const slot = await getSlotById(next.slotId);
    if (!slot) return null;
    const results = await batch([
      await releaseHeldSlot(id),
      await prepare("UPDATE slots SET status = 'booked' WHERE id = ?", slot.id),
      await prepare(
        `UPDATE appointments SET
            slot_id = ?, date = ?, start_time = ?, end_time = ?,
            -- A slot that offers both keeps the format the client already had.
            session_type = CASE WHEN ? = 'both' THEN session_type ELSE ? END
          WHERE id = ? RETURNING *`,
        slot.id,
        slot.date,
        slot.startTime,
        slot.endTime,
        slot.sessionType,
        slot.sessionType,
        id,
      ),
    ]);
    return firstRow(results[2]);
  }

  const results = await batch([
    await releaseHeldSlot(id),
    await prepare(
      `UPDATE appointments SET slot_id = NULL, date = ?, start_time = ?, end_time = ?, session_type = ?
        WHERE id = ? RETURNING *`,
      next.date,
      next.startTime,
      next.endTime,
      next.sessionType,
      id,
    ),
  ]);
  return firstRow(results[1]);
}
