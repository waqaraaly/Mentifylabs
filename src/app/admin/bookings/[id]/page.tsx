import { requireAdmin } from "@/lib/session";
import { notFound } from "next/navigation";
import { getAppointmentById } from "@/data/appointments";
import { getAllPractitioners } from "@/data/practitioners";
import { TopBar } from "@/components/admin/TopBar";
import { AppointmentDetail } from "@/components/admin/AppointmentDetail";

export const metadata = { title: "Appointment" };

export default async function AdminAppointmentPage({ params }: PageProps<"/admin/bookings/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const appointment = await getAppointmentById(id);
  if (!appointment) notFound();

  const practitioner = (await getAllPractitioners()).find((p) => p.slug === appointment.practitionerSlug) ?? null;

  return (
    <div>
      <TopBar title="Appointment" subtitle="Booking details" />
      <div style={{ padding: "0 32px 40px" }}>
        {/* Who the client is, and what they wrote to their practitioner, stays between the two of them, so it is dropped here. */}
        <AppointmentDetail b={{ ...appointment, concern: undefined, clientName: "", clientContact: "" }} practitioner={practitioner} />
      </div>
    </div>
  );
}
