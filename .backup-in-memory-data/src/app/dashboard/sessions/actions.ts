"use server";

import { revalidatePath } from "next/cache";
import { revalidateAdminViews } from "@/lib/revalidate";
import { parseBookedSessionType } from "@/lib/sessionType";
import { setAppointmentStatus, rescheduleAppointment, deleteAppointment, createManualAppointment } from "@/data/appointments";

function revalidatePortalAndPublic(slug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard/slots");
  revalidatePath(`/${slug}`);
  revalidateAdminViews();
}

export async function approveAppointment(formData: FormData) {
  const id = formData.get("id")?.toString();
  const slug = formData.get("slug")?.toString();
  if (!id || !slug) return;
  await setAppointmentStatus(id, "confirmed");
  revalidatePortalAndPublic(slug);
}

export async function declineAppointment(formData: FormData) {
  const id = formData.get("id")?.toString();
  const slug = formData.get("slug")?.toString();
  if (!id || !slug) return;
  await setAppointmentStatus(id, "cancelled");
  revalidatePortalAndPublic(slug);
}

export async function cancelAppointment(formData: FormData) {
  const id = formData.get("id")?.toString();
  const slug = formData.get("slug")?.toString();
  if (!id || !slug) return;
  await setAppointmentStatus(id, "cancelled");
  revalidatePortalAndPublic(slug);
}

export async function completeAppointment(formData: FormData) {
  const id = formData.get("id")?.toString();
  const slug = formData.get("slug")?.toString();
  if (!id || !slug) return;
  await setAppointmentStatus(id, "completed");
  revalidatePortalAndPublic(slug);
}

export async function scheduleSessionAction(formData: FormData) {
  const slug = formData.get("slug")?.toString();
  const clientName = formData.get("clientName")?.toString()?.trim();
  const clientContact = formData.get("clientContact")?.toString()?.trim() ?? "";
  if (!slug || !clientName) return;

  const slotId = formData.get("slotId")?.toString();
  const date = formData.get("date")?.toString();
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const sessionType = parseBookedSessionType(formData.get("sessionType")?.toString());

  if (slotId) {
    await createManualAppointment({ practitionerSlug: slug, clientName, clientContact, slotId, sessionType });
  } else if (date && startTime && endTime && sessionType) {
    await createManualAppointment({ practitionerSlug: slug, clientName, clientContact, date, startTime, endTime, sessionType });
  } else {
    return;
  }

  revalidatePortalAndPublic(slug);
}

export async function deleteAppointmentAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  const slug = formData.get("slug")?.toString();
  if (!id || !slug) return;
  await deleteAppointment(id);
  revalidatePortalAndPublic(slug);
}

export async function rescheduleAppointmentAction(formData: FormData) {
  const id = formData.get("id")?.toString();
  const slug = formData.get("slug")?.toString();
  if (!id || !slug) return;

  const slotId = formData.get("slotId")?.toString();
  const date = formData.get("date")?.toString();
  const startTime = formData.get("startTime")?.toString();
  const endTime = formData.get("endTime")?.toString();
  const sessionType = parseBookedSessionType(formData.get("sessionType")?.toString());

  if (slotId) {
    await rescheduleAppointment(id, { slotId });
  } else if (date && startTime && endTime && sessionType) {
    await rescheduleAppointment(id, { date, startTime, endTime, sessionType });
  } else {
    return;
  }

  revalidatePortalAndPublic(slug);
}
