import { getAllPractitioners } from "@/data/practitioners";
import { getAdminSettings } from "@/data/adminSettings";
import { PractitionersView } from "@/components/admin/PractitionersView";

export const metadata = { title: "Practitioners" };

export default async function AdminPractitionersPage() {
  const [practitioners, settings] = await Promise.all([
    getAllPractitioners(),
    getAdminSettings(),
  ]);

  return (
    <PractitionersView
      practitioners={practitioners}
      defaultSkipVerification={settings.skipVerificationByDefault}
    />
  );
}
