import { requireAdmin } from "@/lib/session";
import { getAllPractitioners } from "@/data/practitioners";
import { PractitionersView } from "@/components/admin/PractitionersView";

export const metadata = { title: "Practitioners" };

export default async function AdminPractitionersPage() {
  await requireAdmin();
  return <PractitionersView practitioners={await getAllPractitioners()} />;
}
