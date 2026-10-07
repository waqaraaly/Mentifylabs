"use server";

import { revalidatePath } from "next/cache";
import { revalidateAdminViews } from "@/lib/revalidate";
import { parseBookedSessionType } from "@/lib/sessionType";
import {
  setAppointmentStatus,
  rescheduleAppointment,
  deleteAppointment,
  createManualAppointment,
  getAppointmentById,
} from "@/data/appointments";
import { getSlotById, openSlotOverlapping } from "@/data/slots";
import { getPractitionerBySlug, requireOwnSlug } from "@/data/practitioners";
import { isPastIn, todayIn, zoneOrDefault } from "@/lib/time";
import { STATUS_MOVES, timeAllows, type MovableStatus } from "@/lib/appointmentRules";
import { BOOKING_LIMITS, isIsoDate, isTimeOfDay } from "@/lib/validate";

function revalidatePortalAndPublic(slug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard/slots");
  revalidatePath(`/${slug}`);
  revalidateAdminViews();
}

/** The signed-in practitioner's slug and the appointment id, if that appointment is theirs. */
async function ownAppointment(formData: FormData): Promise<{ slug: string; id: string } | null> {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const id = formData.get("id")?.toString();
  if (!id) return null;
  const appointment = await getAppointmentById(id);
  return appointment?.practitionerSlug === slug ? { slug, id } : null;
}

/** Whether this date is a day that has already gone, on the practitioner's own clock (not the server's). */
async function dayHasGone(date: string, slug: string): Promise<boolean> {
  const practitioner = await getPractitionerBySlug(slug);
  return !practitioner || date < todayIn(practitioner.timezone);
}

/** A slot id from the form, only if that slot belongs to this practitioner and is not on a day that has already gone. */
async function ownSlotId(slotId: string | undefined, slug: string): Promise<string | null> {
  if (!slotId) return null;
  const slot = await getSlotById(slotId);
  return slot?.practitionerSlug === slug && !(await dayHasGone(slot.date, slug)) ? slot.id : null;
}

/** The result of a change the practitioner asked for on a time. A message means nothing was saved. */
export interface SessionResult {
  error?: string;
}

const CLASH = "That time overlaps one of your open slots, so a client could still book it. Pick that slot from the list instead, or choose a time that doesn't overlap one.";

async function setStatus(formData: FormData, status: MovableStatus) {
  const own = await ownAppointment(formData);
  if (!own) return;
  const appointment = await getAppointmentById(own.id);
  const practitioner = await getPractitionerBySlug(own.slug);
  if (appointment && practitioner) {
    const started = isPastIn(appointment.date, appointment.startTime, zoneOrDefault(practitioner.timezone));
    // Only legal moves are saved: nothing comes back from an old tab or a hand-made request.
    if (timeAllows(status, started)) await setAppointmentStatus(own.id, status, STATUS_MOVES[status]);
  }
  // Refreshing either way means a screen that was out of date shows what is true now.
  revalidatePortalAndPublic(own.slug);
}

export async function approveAppointment(formData: FormData) {
  await setStatus(formData, "confirmed");
}

export async function declineAppointment(formData: FormData) {
  await setStatus(formData, "cancelled");
}

export async function cancelAppointment(formData: FormData) {
  await setStatus(formData, "cancelled");
}

export async function completeAppointment(formData: FormData) {
  await setStatus(formData, "completed");
}

export async function scheduleSessionAction(formData: FormData): Promise<SessionResult> {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const clientName = formData.get("clientName")?.toString()?.trim();
  const clientContact = formData.get("clientContact")?.toString()?.trim() ?? "";
  if (!clientName || clientName.length > BOOKING_LIMITS.name || clientContact.length > BOOKING_LIMITS.contact) {
    return { error: "Check the client's name and contact details." };
  }

  const requestedSlot = formData.get("slotId")?.toString();
  const date = formData.get("date")?.toString();
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const sessionType = parseBookedSessionType(formData.get("sessionType")?.toString());

  if (requestedSlot) {
    const slotId = await ownSlotId(requestedSlot, slug);
    if (!slotId) return { error: "That slot isn't available any more. Choose another." };
    if (!(await createManualAppointment({ practitionerSlug: slug, clientName, clientContact, slotId, sessionType }))) {
      return { error: "That slot isn't available any more. Choose another." };
    }
  } else if (isIsoDate(date) && !(await dayHasGone(date, slug)) && isTimeOfDay(startTime) && isTimeOfDay(endTime) && startTime < endTime && sessionType) {
    // A session at a made-up time holds no slot, so it can't sit on top of one a client could still book.
    if (await openSlotOverlapping(slug, date, startTime, endTime)) return { error: CLASH };
    await createManualAppointment({ practitionerSlug: slug, clientName, clientContact, date, startTime, endTime, sessionType });
  } else {
    return { error: "Choose a date and a start and end time that haven't passed." };
  }

  revalidatePortalAndPublic(slug);
  return {};
}

export async function deleteAppointmentAction(formData: FormData) {
  const own = await ownAppointment(formData);
  if (!own) return;
  await deleteAppointment(own.id); // only a record that is over; a live one is cancelled instead
  revalidatePortalAndPublic(own.slug);
}

export async function rescheduleAppointmentAction(formData: FormData): Promise<SessionResult> {
  const own = await ownAppointment(formData);
  if (!own) return { error: "That appointment can't be found." };

  const requestedSlot = formData.get("slotId")?.toString();
  const date = formData.get("date")?.toString();
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const sessionType = parseBookedSessionType(formData.get("sessionType")?.toString());

  const CANT_MOVE = { error: "That appointment can't be moved. Refresh the page to see where it stands." };
  if (requestedSlot) {
    const slotId = await ownSlotId(requestedSlot, own.slug);
    if (!slotId) return { error: "That slot isn't available any more. Choose another." };
    if (!(await rescheduleAppointment(own.id, { slotId }))) return CANT_MOVE;
  } else if (isIsoDate(date) && !(await dayHasGone(date, own.slug)) && isTimeOfDay(startTime) && isTimeOfDay(endTime) && startTime < endTime && sessionType) {
    // Moving to a made-up time frees the slot this appointment holds, so that slot would be open under the new time too.
    const held = (await getAppointmentById(own.id))?.slotId;
    const heldSlot = held ? await getSlotById(held) : null;
    const overlapsHeld = !!heldSlot && heldSlot.date === date && heldSlot.startTime < endTime && heldSlot.endTime > startTime;
    if (overlapsHeld || (await openSlotOverlapping(own.slug, date, startTime, endTime))) return { error: CLASH };
    if (!(await rescheduleAppointment(own.id, { date, startTime, endTime, sessionType }))) return CANT_MOVE;
  } else {
    return { error: "Choose a date and a start and end time that haven't passed." };
  }

  revalidatePortalAndPublic(own.slug);
  return {};
}
