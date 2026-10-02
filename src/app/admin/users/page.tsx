import { getAllUsers } from "@/data/users";
import { requireAdmin } from "@/lib/session";
import { ManageUsersView } from "@/components/admin/ManageUsersView";

export const metadata = { title: "Manage Users" };

export default async function ManageUsersPage() {
  const admin = await requireAdmin();
  const users = await getAllUsers();
  return <ManageUsersView users={users} currentUserId={admin.id} />;
}
