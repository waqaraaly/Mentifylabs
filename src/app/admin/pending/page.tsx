import { requireAdmin } from "@/lib/session";
import { getAllPractitioners } from "@/data/practitioners";
import { getAllDocuments } from "@/data/documents";
import { isAwaitingApproval } from "@/lib/verification";
import { PendingView } from "@/components/admin/PendingView";

export const metadata = { title: "Pending Approval" };

export default async function AdminPendingPage() {
  await requireAdmin();
  const [practitioners, documents] = await Promise.all([getAllPractitioners(), getAllDocuments()]);

  // Everyone who has submitted their credentials and is waiting for a decision, longest wait first.
  const queue = practitioners
    .filter(isAwaitingApproval)
    .sort((a, b) => (a.verificationSubmittedAt ?? "").localeCompare(b.verificationSubmittedAt ?? ""));

  const documentCounts: Record<string, number> = {};
  for (const d of documents) documentCounts[d.practitionerSlug] = (documentCounts[d.practitionerSlug] ?? 0) + 1;

  return <PendingView queue={queue} documentCounts={documentCounts} />;
}
