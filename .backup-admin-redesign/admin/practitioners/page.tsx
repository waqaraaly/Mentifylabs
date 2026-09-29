import { getAllPractitioners } from "@/data/practitioners";
import { getAllAppointments } from "@/data/appointments";
import { getAllDocuments } from "@/data/documents";
import { getAllFeatures, getAccessForPractitioner, getFeatureLogs } from "@/data/features";
import { siteConfig } from "@/lib/site";
import { PractitionersView } from "@/components/admin/PractitionersView";

export const metadata = { title: "Practitioners" };

export default async function AdminPractitionersPage() {
  const [practitioners, appointments, documents, features, logs] = await Promise.all([
    getAllPractitioners(),
    getAllAppointments(),
    getAllDocuments(),
    getAllFeatures(),
    getFeatureLogs(),
  ]);

  const accessEntries = await Promise.all(
    practitioners.map(async (p) => [p.slug, await getAccessForPractitioner(p.slug)] as const),
  );
  const accessBySlug = Object.fromEntries(accessEntries);

  return (
    <PractitionersView
      practitioners={practitioners}
      appointments={appointments}
      documents={documents}
      features={features}
      accessBySlug={accessBySlug}
      logs={logs}
      siteUrl={siteConfig.url}
    />
  );
}
