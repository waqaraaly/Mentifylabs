import { getAllPractitioners } from "@/data/practitioners";
import { getAllAppointments } from "@/data/appointments";
import { ReportsView } from "@/components/admin/ReportsView";

export const metadata = { title: "Reports & Analytics" };

export default async function AdminReportsPage() {
  const [practitioners, appointments] = await Promise.all([
    getAllPractitioners(),
    getAllAppointments(),
  ]);

  return <ReportsView practitioners={practitioners} appointments={appointments} />;
}
