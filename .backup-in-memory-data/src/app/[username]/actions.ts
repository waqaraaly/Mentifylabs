"use server";

import { revalidatePath } from "next/cache";
import { getPublicPractitionerBySlug } from "@/data/practitioners";
import { createAppointmentFromSlot } from "@/data/appointments";
import { revalidateAdminViews } from "@/lib/revalidate";
import { parseBookedSessionType } from "@/lib/sessionType";

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

  const appointment = await createAppointmentFromSlot({
    slotId,
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
