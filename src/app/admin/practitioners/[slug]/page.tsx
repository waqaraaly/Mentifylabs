import { requireAdmin } from "@/lib/session";
import { notFound } from "next/navigation";
import { getAllPractitioners } from "@/data/practitioners";
import { getAllAppointments } from "@/data/appointments";
import { getDocumentsByPractitioner } from "@/data/documents";
import { getAllFeatures, getAccessForPractitioner, getFeatureLogs } from "@/data/features";
import { getReviewEvents } from "@/data/reviewEvents";
import { siteConfig } from "@/lib/site";
import { TopBar } from "@/components/admin/TopBar";
import { PractitionerDetail } from "@/components/admin/PractitionerDetail";

export async function generateMetadata({ params }: PageProps<"/admin/practitioners/[slug]">) {
  const { slug } = await params;
  const practitioner = (await getAllPractitioners()).find((p) => p.slug === slug);
  return { title: practitioner ? practitioner.fullName : "Practitioner" };
}

export default async function AdminPractitionerPage({ params }: PageProps<"/admin/practitioners/[slug]">) {
  await requireAdmin();
  const { slug } = await params;
  const practitioner = (await getAllPractitioners()).find((p) => p.slug === slug);
  if (!practitioner) notFound();

  const [appointments, documents, features, accessIds, logs, history] = await Promise.all([
    getAllAppointments(),
    getDocumentsByPractitioner(slug),
    getAllFeatures(),
    getAccessForPractitioner(slug),
    getFeatureLogs(),
    getReviewEvents(slug),
  ]);

  return (
    <div>
      <TopBar title="Practitioner profile" subtitle="Review and manage this account" />
      <div style={{ padding: "0 32px 40px" }}>
        <PractitionerDetail
          p={practitioner}
          appointments={appointments}
          documents={documents}
          features={features}
          accessIds={accessIds}
          logs={logs}
          history={history}
          siteUrl={siteConfig.url}
        />
      </div>
    </div>
  );
}
