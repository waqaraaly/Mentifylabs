import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { getAllPractitioners } from "@/data/practitioners";
import { getDocumentsByPractitioner } from "@/data/documents";
import { TopBar } from "@/components/admin/TopBar";
import { VerificationReview } from "@/components/admin/VerificationReview";

export async function generateMetadata({ params }: PageProps<"/admin/verification/[slug]">) {
  const { slug } = await params;
  const practitioner = (await getAllPractitioners()).find((p) => p.slug === slug);
  return { title: practitioner ? `Verify ${practitioner.fullName}` : "Verification review" };
}

export default async function AdminVerificationReviewPage({ params }: PageProps<"/admin/verification/[slug]">) {
  await requireAdmin();
  const { slug } = await params;
  const practitioner = (await getAllPractitioners()).find((p) => p.slug === slug);
  if (!practitioner) notFound();

  const documents = await getDocumentsByPractitioner(slug);

  return (
    <div>
      <TopBar title="Verification review" subtitle="Check the documents, then approve or send back" />
      <div style={{ padding: "0 32px 40px" }}>
        <VerificationReview p={practitioner} documents={documents} />
      </div>
    </div>
  );
}
