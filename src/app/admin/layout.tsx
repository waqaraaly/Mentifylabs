import "./admin.css";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getAllPractitioners } from "@/data/practitioners";
import { getAllAppointments } from "@/data/appointments";
import { todayIsoDate } from "@/lib/format";
import { isAwaitingApproval } from "@/lib/verification";
import { Sidebar } from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/ui/ToastProvider";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Live data from D1 on every request, never a copy prerendered at build time.
  await connection();
  const admin = await requireAdmin();
  const [practitioners, appointments] = await Promise.all([getAllPractitioners(), getAllAppointments()]);
  const today = todayIsoDate();

  const counts = {
    practitioners: practitioners.length,
    pending: practitioners.filter(isAwaitingApproval).length,
    bookingsToday: appointments.filter((a) => a.date === today).length,
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
