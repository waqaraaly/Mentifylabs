import { getAllPractitioners } from "@/data/practitioners";
import { getAllDocuments } from "@/data/documents";
import { siteConfig } from "@/lib/site";
import { PendingView } from "@/components/admin/PendingView";

export const metadata = { title: "Pending Approval" };

export default async function AdminPendingPage() {
  const [practitioners, documents] = await Promise.all([
    getAllPractitioners(),
    getAllDocuments(),
  ]);

  const queue = practitioners.filter(
    (p) => p.status === "pending" || ["in_review", "incomplete", "draft"].includes(p.profileStatus),
  );

  return <PendingView queue={queue} documents={documents} siteUrl={siteConfig.url} />;
}
