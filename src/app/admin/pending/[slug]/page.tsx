import { requireAdmin } from "@/lib/session";
import { notFound } from "next/navigation";
import { getAllPractitioners } from "@/data/practitioners";
import { getDocumentsByPractitioner } from "@/data/documents";
import { getSentBackFor } from "@/data/credentialQueue";
import { getReviewEvents } from "@/data/reviewEvents";
import { TopBar } from "@/components/admin/TopBar";
import { ShieldCheck } from "lucide-react";
import { CredentialReview } from "@/components/admin/CredentialReview";

export async function generateMetadata({ params }: PageProps<"/admin/pending/[slug]">) {
  const { slug } = await params;
  const practitioner = (await getAllPractitioners()).find((p) => p.slug === slug);
  return { title: practitioner ? `Review ${practitioner.fullName}` : "Review credentials" };
}

export default async function AdminCredentialReviewPage({ params }: PageProps<"/admin/pending/[slug]">) {
  await requireAdmin();
  const { slug } = await params;
  const practitioner = (await getAllPractitioners()).find((p) => p.slug === slug);
  if (!practitioner) notFound();

  const [documents, sentBack, events] = await Promise.all([getDocumentsByPractitioner(slug), getSentBackFor(slug), getReviewEvents(slug)]);
  // Every time their credentials were sent back, oldest first, so the rounds can be numbered.
  const sendBacks = events
    .filter((e) => e.kind === "verification_rejected")
    .map((e) => ({ id: e.id, at: e.createdAt, reason: e.note ?? "", by: e.actorName ?? "" }))
    .reverse();

  return (
    <div>
      <TopBar icon={ShieldCheck} title="Review credentials" subtitle="What they submitted, and your decision" />
      <div style={{ padding: "0 var(--ml-gutter) 40px" }}>
        <CredentialReview p={practitioner} documents={documents} sentBack={sentBack} sendBacks={sendBacks} />
      </div>
    </div>
  );
}
