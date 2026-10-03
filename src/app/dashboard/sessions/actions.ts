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
import { getSlotById } from "@/data/slots";
import { requireOwnSlug } from "@/data/practitioners";
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

/** A slot id from the form, only if that slot belongs to this practitioner. */
async function ownSlotId(slotId: string | undefined, slug: string): Promise<string | null> {
  if (!slotId) return null;
  const slot = await getSlotById(slotId);
  return slot?.practitionerSlug === slug ? slot.id : null;
}

async function setStatus(formData: FormData, status: "confirmed" | "cancelled" | "completed") {
  const own = await ownAppointment(formData);
  if (!own) return;
  await setAppointmentStatus(own.id, status);
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

export async function scheduleSessionAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const clientName = formData.get("clientName")?.toString()?.trim();
  const clientContact = formData.get("clientContact")?.toString()?.trim() ?? "";
  if (!clientName || clientName.length > BOOKING_LIMITS.name || clientContact.length > BOOKING_LIMITS.contact) return;

  const requestedSlot = formData.get("slotId")?.toString();
  const date = formData.get("date")?.toString();
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const sessionType = parseBookedSessionType(formData.get("sessionType")?.toString());

  if (requestedSlot) {
    const slotId = await ownSlotId(requestedSlot, slug);
    if (!slotId) return;
    await createManualAppointment({ practitionerSlug: slug, clientName, clientContact, slotId, sessionType });
  } else if (isIsoDate(date) && isTimeOfDay(startTime) && isTimeOfDay(endTime) && startTime < endTime && sessionType) {
    await createManualAppointment({ practitionerSlug: slug, clientName, clientContact, date, startTime, endTime, sessionType });
  } else {
    return;
  }

  revalidatePortalAndPublic(slug);
}

export async function deleteAppointmentAction(formData: FormData) {
  const own = await ownAppointment(formData);
  if (!own) return;
  await deleteAppointment(own.id);
  revalidatePortalAndPublic(own.slug);
}

export async function rescheduleAppointmentAction(formData: FormData) {
  const own = await ownAppointment(formData);
  if (!own) return;

  const requestedSlot = formData.get("slotId")?.toString();
  const date = formData.get("date")?.toString();
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const sessionType = parseBookedSessionType(formData.get("sessionType")?.toString());

  if (requestedSlot) {
    const slotId = await ownSlotId(requestedSlot, own.slug);
    if (!slotId) return;
    await rescheduleAppointment(own.id, { slotId });
  } else if (isIsoDate(date) && isTimeOfDay(startTime) && isTimeOfDay(endTime) && startTime < endTime && sessionType) {
    await rescheduleAppointment(own.id, { date, startTime, endTime, sessionType });
  } else {
    return;
  }

  revalidatePortalAndPublic(own.slug);
}
