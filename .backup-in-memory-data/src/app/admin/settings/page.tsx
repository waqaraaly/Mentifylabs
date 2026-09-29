import { getAdminSettings } from "@/data/adminSettings";
import { TopBar } from "@/components/admin/TopBar";
import { SettingsView } from "@/components/admin/SettingsView";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();
  return (
    <div>
      <TopBar title="Settings" subtitle="Your account and how the portal behaves for you" />
      <SettingsView settings={settings} />
    </div>
  );
}
