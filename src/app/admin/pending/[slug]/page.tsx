import { requireAdmin } from "@/lib/session";
import { notFound } from "next/navigation";
import { getAllPractitioners } from "@/data/practitioners";
import { getDocumentsByPractitioner } from "@/data/documents";
import { getReviewEvents } from "@/data/reviewEvents";
import { siteConfig } from "@/lib/site";
import { TopBar } from "@/components/admin/TopBar";
import { ProfileReview } from "@/components/admin/ProfileReview";

export async function generateMetadata({ params }: PageProps<"/admin/pending/[slug]">) {
  const { slug } = await params;
  const practitioner = (await getAllPractitioners()).find((p) => p.slug === slug);
  return { title: practitioner ? `Review ${practitioner.fullName}` : "Profile review" };
}

export default async function AdminProfileReviewPage({ params }: PageProps<"/admin/pending/[slug]">) {
  await requireAdmin();
  const { slug } = await params;
  const practitioner = (await getAllPractitioners()).find((p) => p.slug === slug);
  if (!practitioner) notFound();

  const [documents, history] = await Promise.all([getDocumentsByPractitioner(slug), getReviewEvents(slug)]);

  return (
    <div>
      <TopBar title="Review & approve" subtitle="Check their details and documents, then approve or send it back" />
      <div style={{ padding: "0 32px 40px" }}>
        <ProfileReview p={practitioner} documents={documents} history={history} siteUrl={siteConfig.url} />
      </div>
    </div>
  );
}
