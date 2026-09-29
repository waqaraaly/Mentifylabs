import { getAllFeatures, getPractitionerSlugsWithAccess, getFeatureLogs } from "@/data/features";
import { getAllPractitioners } from "@/data/practitioners";
import { FeaturesView } from "@/components/admin/FeaturesView";

export const metadata = { title: "Feature Library" };

export default async function AdminFeaturesPage() {
  const [features, practitioners, logs] = await Promise.all([
    getAllFeatures(),
    getAllPractitioners(),
    getFeatureLogs(),
  ]);

  const accessEntries = await Promise.all(
    features.map(async (f) => [f.id, await getPractitionerSlugsWithAccess(f.id)] as const),
  );
  const accessByFeature = Object.fromEntries(accessEntries);

  return <FeaturesView features={features} practitioners={practitioners} accessByFeature={accessByFeature} logs={logs} />;
}
