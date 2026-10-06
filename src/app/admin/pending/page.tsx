import { requireAdmin } from "@/lib/session";
import { getCredentialQueue } from "@/data/credentialQueue";
import { PendingView } from "@/components/admin/PendingView";

export const metadata = { title: "Credential review" };

export default async function AdminPendingPage() {
  await requireAdmin();
  const { awaiting, sentBack } = await getCredentialQueue();
  return <PendingView awaiting={awaiting} sentBack={sentBack} />;
}
