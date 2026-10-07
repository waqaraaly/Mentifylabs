import { first } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { TopBar } from "@/components/admin/TopBar";
import { Settings } from "lucide-react";
import { SettingsView } from "@/components/admin/SettingsView";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const row = await first<{ pending_email: string | null; two_factor_enabled_at: string | null }>(
    "SELECT pending_email, two_factor_enabled_at FROM users WHERE id = ?",
    admin.id,
  );
  return (
    <div>
      <TopBar icon={Settings} title="Settings" subtitle="Your account details, password and sign-in security" />
      <SettingsView account={{ name: admin.name, email: admin.email, pendingEmail: row?.pending_email ?? null }} twoFactorEnabled={!!row?.two_factor_enabled_at} />
    </div>
  );
}
