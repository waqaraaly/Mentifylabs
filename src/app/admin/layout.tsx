import "./admin.css";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getAllPractitioners } from "@/data/practitioners";
import { getAllAppointments } from "@/data/appointments";
import { DEFAULT_TIMEZONE, todayIn } from "@/lib/time";
import { isAwaitingApproval } from "@/lib/verification";
import { Sidebar } from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/ui/ToastProvider";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Live data from D1 on every request, never a copy prerendered at build time.
  await connection();
  const admin = await requireAdmin();
  const [practitioners, appointments] = await Promise.all([getAllPractitioners(), getAllAppointments()]);
  // "Today" for an appointment is today on its own practitioner's clock, so it is right in every country.
  const zoneOf = new Map(practitioners.map((p) => [p.slug, p.timezone]));
  const todayByZone = new Map<string, string>();
  const todayFor = (zone: string) => {
    let day = todayByZone.get(zone);
    if (!day) todayByZone.set(zone, (day = todayIn(zone)));
    return day;
  };

  const counts = {
    practitioners: practitioners.length,
    pending: practitioners.filter(isAwaitingApproval).length,
    appointmentsToday: appointments.filter((a) => a.date === todayFor(zoneOf.get(a.practitionerSlug) ?? DEFAULT_TIMEZONE)).length,
  };

  return (
    <div className="ml-admin shell">
      <ToastProvider>
        <Sidebar counts={counts} admin={{ name: admin.name, email: admin.email }} />
        <main className="shell-main">{children}</main>
      </ToastProvider>
    </div>
  );
}
