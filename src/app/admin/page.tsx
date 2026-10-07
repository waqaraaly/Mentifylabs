import { requireAdmin } from "@/lib/session";
import { getAllPractitioners } from "@/data/practitioners";
import { getAllAppointments } from "@/data/appointments";
import { getCredentialQueue } from "@/data/credentialQueue";
import { TopBar } from "@/components/admin/TopBar";
import { LayoutDashboard } from "lucide-react";
import { DashboardView } from "@/components/admin/DashboardView";

export const metadata = { title: "Super Admin Dashboard" };

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [practitioners, appointments, { awaiting }] = await Promise.all([
    getAllPractitioners(),
    getAllAppointments(),
    getCredentialQueue(),
  ]);

  return (
    <div>
      <TopBar
        icon={LayoutDashboard}
        title="Dashboard"
        subtitle={`Platform health at a glance · ${new Date().toDateString()}`}
      />
      <DashboardView
        practitioners={practitioners}
        appointments={appointments}
        queue={awaiting}
      />
    </div>
  );
}
