import { notFound } from "next/navigation";
import { getAllPractitioners } from "@/data/practitioners";
import { getDocumentsByPractitioner } from "@/data/documents";
import { siteConfig } from "@/lib/site";
import { TopBar } from "@/components/admin/TopBar";
import { ProfileReview } from "@/components/admin/ProfileReview";

export async function generateMetadata({ params }: PageProps<"/admin/pending/[slug]">) {
  const { slug } = await params;
  const practitioner = (await getAllPractitioners()).find((p) => p.slug === slug);
  return { title: practitioner ? `Review ${practitioner.fullName}` : "Profile review" };
}

export default async function AdminProfileReviewPage({ params }: PageProps<"/admin/pending/[slug]">) {
  const { slug } = await params;
  const practitioner = (await getAllPractitioners()).find((p) => p.slug === slug);
  if (!practitioner) notFound();

  const documents = await getDocumentsByPractitioner(slug);

  return (
    <div>
      <TopBar title="Profile review" subtitle="Check the profile, then approve or send it back" />
      <div style={{ padding: "0 32px 40px" }}>
        <ProfileReview p={practitioner} documents={documents} siteUrl={siteConfig.url} />
      </div>
    </div>
  );
}
