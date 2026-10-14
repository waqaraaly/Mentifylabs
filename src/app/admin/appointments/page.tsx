import { requireAdmin } from "@/lib/session";
import { getAllAppointments } from "@/data/appointments";
import { getAllPractitioners } from "@/data/practitioners";
import { AppointmentsView } from "@/components/admin/AppointmentsView";

export const metadata = { title: "Appointments" };

export default async function AdminAppointmentsPage() {
  await requireAdmin();
  const [appointments, practitioners] = await Promise.all([
    getAllAppointments(),
    getAllPractitioners(),
  ]);

  return <AppointmentsView appointments={appointments} practitioners={practitioners} />;
}
