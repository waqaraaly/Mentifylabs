import { getAllPractitioners } from "@/data/practitioners";
import { PendingView } from "@/components/admin/PendingView";

export const metadata = { title: "Pending Approval" };

export default async function AdminPendingPage() {
  const practitioners = await getAllPractitioners();

  const queue = practitioners.filter(
    (p) => p.status === "pending" || ["in_review", "incomplete", "draft"].includes(p.profileStatus),
  );

  return <PendingView queue={queue} />;
}
