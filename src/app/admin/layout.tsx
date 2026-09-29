import "./admin.css";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getAllPractitioners } from "@/data/practitioners";
import { getAllAppointments } from "@/data/appointments";
import { getAdminSettings } from "@/data/adminSettings";
import { todayIsoDate } from "@/lib/format";
import { Sidebar } from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/ui/ToastProvider";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Live data from D1 on every request, never a copy prerendered at build time.
  await connection();
  await requireAdmin();
  const [practitioners, appointments, settings] = await Promise.all([
    getAllPractitioners(),
    getAllAppointments(),
    getAdminSettings(),
  ]);
  const today = todayIsoDate();

  const counts = {
    practitioners: practitioners.length,
    pending: practitioners.filter(
      (p) => p.status === "pending" || ["in_review", "incomplete", "draft"].includes(p.profileStatus),
    ).length,
    verification: practitioners.filter((p) => p.verificationStatus === "pending").length,
    bookingsToday: appointments.filter((a) => a.date === today).length,
  };

  return (
    <div className="ml-admin" style={{ display: "flex" }}>
      <ToastProvider>
        <Sidebar counts={counts} admin={{ name: settings.name, email: settings.email }} />
        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </ToastProvider>
    </div>
  );
}
