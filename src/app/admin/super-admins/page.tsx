import { getSuperAdmins } from "@/data/users";
import { requireAdmin } from "@/lib/session";
import { SuperAdminsView } from "@/components/admin/SuperAdminsView";

export const metadata = { title: "Super Admins" };

export default async function SuperAdminsPage() {
  const admin = await requireAdmin();
  const users = await getSuperAdmins();
  return <SuperAdminsView users={users} currentUserId={admin.id} />;
}
