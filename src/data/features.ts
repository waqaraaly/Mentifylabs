import type { Feature, FeatureAccessLog, FeatureLogAction } from "@/types/feature";
import { all, batch, first, prepare } from "@/lib/db";
import { getAllPractitionerSlugs } from "./practitioners";

/** The feature catalog and the per-practitioner access grants are separate tables, joined by feature id. */
interface FeatureRow {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: Feature["status"];
  shared_by_default: number;
  quantity: number | null;
  unit: string | null;
  plan: string;
}
interface LogRow {
  id: string;
  feature_id: string;
  practitioner_slug: string | null;
  action: FeatureLogAction;
  by: string;
  at: string;
  note: string | null;
}

const toFeature = (r: FeatureRow): Feature => ({
  id: r.id,
  name: r.name,
  description: r.description,
  icon: r.icon,
  category: r.category,
  status: r.status,
  sharedByDefault: r.shared_by_default === 1,
  quantity: r.quantity ?? undefined,
  unit: r.unit ?? undefined,
  plan: r.plan,
});
const toLog = (r: LogRow): FeatureAccessLog => ({
  id: r.id,
  featureId: r.feature_id,
  practitionerSlug: r.practitioner_slug,
  action: r.action,
  by: r.by,
  at: r.at,
  note: r.note ?? undefined,
});

const logAccess = (featureId: string, practitionerSlug: string | null, action: FeatureLogAction) =>
  prepare(
    "INSERT INTO feature_access_logs (feature_id, practitioner_slug, action, by) VALUES (?, ?, ?, 'Super Admin')",
    featureId,
    practitionerSlug,
    action,
  );

export async function getAllFeatures(): Promise<Feature[]> {
  const rows = await all<FeatureRow>("SELECT * FROM features ORDER BY sort_order");
  return rows.map(toFeature);
}

export async function getFeatureById(id: string): Promise<Feature | null> {
  const row = await first<FeatureRow>("SELECT * FROM features WHERE id = ?", id);
  return row ? toFeature(row) : null;
}

export async function getAccessForPractitioner(slug: string): Promise<string[]> {
  const rows = await all<{ id: string }>(
    `SELECT id FROM features WHERE shared_by_default = 1
     UNION
     SELECT feature_id FROM feature_access WHERE practitioner_slug = ?`,
    slug,
  );
  return rows.map((r) => r.id);
}

export async function getPractitionerSlugsWithAccess(featureId: string): Promise<string[]> {
  const [feature, slugs, grantedRows, revokedRows] = await Promise.all([
    getFeatureById(featureId),
    getAllPractitionerSlugs(),
    all<{ practitioner_slug: string }>("SELECT practitioner_slug FROM feature_access WHERE feature_id = ?", featureId),
    all<{ practitioner_slug: string }>(
      `SELECT DISTINCT practitioner_slug FROM feature_access_logs
        WHERE feature_id = ? AND action = 'revoked' AND practitioner_slug IS NOT NULL`,
      featureId,
    ),
  ]);
  const granted = new Set(grantedRows.map((r) => r.practitioner_slug));
  const revoked = new Set(revokedRows.map((r) => r.practitioner_slug));
  return slugs.filter((slug) => {
    if (granted.has(slug)) return true;
    if (revoked.has(slug)) return false;
    return feature?.sharedByDefault ?? false;
  });
}

export async function hasAccess(slug: string, featureId: string): Promise<boolean> {
  return (await getAccessForPractitioner(slug)).includes(featureId);
}

export async function grantAccess(slug: string, featureId: string): Promise<void> {
  await batch([
    await prepare("INSERT OR IGNORE INTO feature_access (feature_id, practitioner_slug) VALUES (?, ?)", featureId, slug),
    await logAccess(featureId, slug, "granted"),
  ]);
}

export async function revokeAccess(slug: string, featureId: string): Promise<void> {
  await batch([
    await prepare("DELETE FROM feature_access WHERE feature_id = ? AND practitioner_slug = ?", featureId, slug),
    await logAccess(featureId, slug, "revoked"),
  ]);
}

export async function grantAccessToAll(featureId: string): Promise<void> {
  await batch([
    await prepare(
      "INSERT OR IGNORE INTO feature_access (feature_id, practitioner_slug) SELECT ?, slug FROM practitioners",
      featureId,
    ),
    await prepare("UPDATE features SET shared_by_default = 1 WHERE id = ?", featureId),
    await logAccess(featureId, null, "enabled_all"),
  ]);
}

export async function revokeAccessFromAll(featureId: string): Promise<void> {
  await batch([
    await prepare("DELETE FROM feature_access WHERE feature_id = ?", featureId),
    await prepare("UPDATE features SET shared_by_default = 0 WHERE id = ?", featureId),
    await logAccess(featureId, null, "disabled_all"),
  ]);
}

export async function getFeatureLogs(featureId?: string): Promise<FeatureAccessLog[]> {
  const rows = await all<LogRow>(
    "SELECT * FROM feature_access_logs WHERE (?1 IS NULL OR feature_id = ?1) ORDER BY at DESC",
    featureId,
  );
  return rows.map(toLog);
}
