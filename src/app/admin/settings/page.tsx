import { first } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { TopBar } from "@/components/admin/TopBar";
import { SettingsView } from "@/components/admin/SettingsView";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const pending = await first<{ pending_email: string | null }>("SELECT pending_email FROM users WHERE id = ?", admin.id);
  return (
    <div>
      <TopBar title="Settings" subtitle="Your account details and password" />
      <SettingsView account={{ name: admin.name, email: admin.email, pendingEmail: pending?.pending_email ?? null }} />
    </div>
  );
}
