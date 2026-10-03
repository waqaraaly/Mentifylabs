"use server";

import { revalidatePath } from "next/cache";
import { getPublicPractitionerBySlug } from "@/data/practitioners";
import { createAppointmentFromSlot } from "@/data/appointments";
import { revalidateAdminViews } from "@/lib/revalidate";
import { parseBookedSessionType } from "@/lib/sessionType";
import { clientIp, isLimited, recordHit } from "@/lib/rateLimit";
import { BOOKING_LIMITS } from "@/lib/validate";

const BOOKING_MAX_PER_HOUR = 6;

export interface BookingFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function bookAppointment(
  slug: string,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const practitioner = await getPublicPractitionerBySlug(slug);
  if (!practitioner) {
    return { status: "error", message: "This practitioner could not be found." };
  }

  if (!practitioner.acceptingBookings) {
    return {
      status: "error",
      message: `${practitioner.fullName} isn't taking new bookings right now. Please check back later.`,
    };
  }

  const slotId = formData.get("slotId")?.toString().trim();
  const fullName = formData.get("fullName")?.toString().trim();
  const contactNumber = formData.get("contactNumber")?.toString().trim();
  const concern = formData.get("concern")?.toString().trim();
  const format = parseBookedSessionType(formData.get("format")?.toString());

  if (!slotId) {
    return { status: "error", message: "Please select an available slot." };
  }
  if (!fullName || !contactNumber) {
    return { status: "error", message: "Please share your name and contact number." };
  }
  if (
    fullName.length > BOOKING_LIMITS.name ||
    contactNumber.length > BOOKING_LIMITS.contact ||
    (concern?.length ?? 0) > BOOKING_LIMITS.concern
  ) {
    return { status: "error", message: "One of the details is too long. Please shorten it and try again." };
  }
  // A phone number or email: digits/symbols for a number, or something@something for an email.
  if (!/^[\d\s+()-]{7,}$/.test(contactNumber) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactNumber)) {
    return { status: "error", message: "Please enter a valid phone number or email so they can reach you." };
  }

  // Throttle by network address so the form can't be scripted to fill someone's calendar.
  // (Local development has no Cloudflare address header, so it isn't throttled.)
  const ip = await clientIp();
  const limitKey = `book:${ip}`;
  if (ip !== "local" && (await isLimited(limitKey, BOOKING_MAX_PER_HOUR, 60))) {
    return { status: "error", message: "Too many booking requests from this network. Please try again later." };
  }

  const appointment = await createAppointmentFromSlot({
    slotId,
    practitionerSlug: practitioner.slug,
    clientName: fullName,
    clientContact: contactNumber,
    concern: concern || undefined,
    sessionType: format,
  });

  if (!appointment) {
    return {
      status: "error",
      message: "That slot was just taken — please choose another one.",
    };
  }

  if (ip !== "local") await recordHit(limitKey);

  // Step 5 of the booking flow: the practitioner sees this in their portal's
  // New Inquiries tab, and the slot disappears from the public page.
  revalidatePath(`/${slug}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sessions");
  revalidateAdminViews();

  return {
    status: "success",
    message: `Your session has been temporarily booked. ${practitioner.fullName} will contact you shortly.`,
  };
}
