import { requireAdmin } from "@/lib/session";
import { getAllAppointments } from "@/data/appointments";
import { getAllPractitioners } from "@/data/practitioners";
import { todayIsoDate } from "@/lib/format";
import { BookingsView } from "@/components/admin/BookingsView";

export const metadata = { title: "Bookings" };

export default async function AdminBookingsPage() {
  await requireAdmin();
  const [appointments, practitioners] = await Promise.all([
    getAllAppointments(),
    getAllPractitioners(),
  ]);

  return <BookingsView appointments={appointments} practitioners={practitioners} today={todayIsoDate()} />;
}
