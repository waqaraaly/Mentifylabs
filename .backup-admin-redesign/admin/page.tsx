import { getAllPractitioners } from "@/data/practitioners";
import { getAllAppointments } from "@/data/appointments";
import { getDocumentsByPractitioner } from "@/data/documents";
import { todayIsoDate } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import { TopBar } from "@/components/admin/TopBar";
import { DashboardView } from "@/components/admin/DashboardView";

export const metadata = { title: "Super Admin Dashboard" };

export default async function AdminDashboardPage() {
  const [practitioners, appointments] = await Promise.all([
    getAllPractitioners(),
    getAllAppointments(),
  ]);
  const today = todayIsoDate();

  const pending = practitioners.filter((p) => p.status === "pending");
  const documentsByPending = Object.fromEntries(
    await Promise.all(pending.map(async (p) => [p.slug, await getDocumentsByPractitioner(p.slug)] as const)),
  );

  return (
    <div>
      <TopBar
        title="Dashboard"
        subtitle={`Platform health at a glance · ${new Date().toDateString()}`}
      />
      <DashboardView
        practitioners={practitioners}
        appointments={appointments}
        today={today}
        documentsByPending={documentsByPending}
        siteUrl={siteConfig.url}
      />
    </div>
  );
}
