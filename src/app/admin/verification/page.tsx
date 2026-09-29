import { requireAdmin } from "@/lib/session";
import { getAllPractitioners } from "@/data/practitioners";
import { VerificationView } from "@/components/admin/VerificationView";

export const metadata = { title: "Verification Requests" };

export default async function AdminVerificationPage() {
  await requireAdmin();
  const practitioners = await getAllPractitioners();
  const queue = practitioners.filter((p) => p.verificationStatus === "pending");

  return <VerificationView queue={queue} />;
}
