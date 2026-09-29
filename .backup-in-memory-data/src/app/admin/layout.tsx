import "./admin.css";
import { getAllPractitioners } from "@/data/practitioners";
import { getAllAppointments } from "@/data/appointments";
import { getAdminSettings } from "@/data/adminSettings";
import { todayIsoDate } from "@/lib/format";
import { Sidebar } from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/ui/ToastProvider";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
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
    bookingsToday: appointments.filter((a) => a.date === today).length,
  };

  return (
    <div className="zf-admin" style={{ display: "flex" }}>
      <ToastProvider>
        <Sidebar counts={counts} admin={{ name: settings.name, email: settings.email }} />
        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </ToastProvider>
    </div>
  );
}
