import type { Feature, FeatureAccess, FeatureAccessLog, FeatureLogAction } from "@/types/feature";
import { getAllPractitioners } from "./practitioners";

/**
 * In-memory data source. The feature catalog and the per-practitioner
 * access grants are separate collections, joined by featureId.
 */
const FEATURES: Feature[] = [
  {
    id: "video-sessions",
    name: "Video Sessions",
    description: "1-to-1 encrypted video calls with screen share and waiting room.",
    icon: "Video",
    category: "Sessions",
    status: "live",
    sharedByDefault: true,
    quantity: 100,
    unit: "sessions / mo",
    plan: "All plans",
  },
  {
    id: "group-therapy",
    name: "Group Therapy Booking",
    description: "Allow clients to book group therapy sessions.",
    icon: "Users",
    category: "Scheduling",
    status: "beta",
    sharedByDefault: false,
    quantity: 20,
    unit: "sessions / mo",
    plan: "Growth+",
  },
  {
    id: "messaging",
    name: "Client Messaging",
    description: "Secure in-app encrypted chat between practitioner and client.",
    icon: "Mail",
    category: "Engagement",
    status: "live",
    sharedByDefault: true,
    quantity: 500,
    unit: "threads",
    plan: "Growth+",
  },
  {
    id: "ai-notes",
    name: "AI Session Notes",
    description: "Automatically summarize session notes with AI assistance.",
    icon: "FileText",
    category: "Records",
    status: "beta",
    sharedByDefault: false,
    quantity: 0,
    unit: "unlimited",
    plan: "Growth+",
  },
  {
    id: "custom-branding",
    name: "Custom Branding",
    description: "Let practitioners customize their public profile theme.",
    icon: "Palette",
    category: "Presence",
    status: "disabled",
    sharedByDefault: false,
    plan: "Enterprise",
  },
  {
    id: "waitlist",
    name: "Waitlist Management",
    description: "Automatically notify clients when a slot opens up.",
    icon: "Bell",
    category: "Engagement",
    status: "live",
    sharedByDefault: true,
    quantity: 200,
    unit: "messages / mo",
    plan: "All plans",
  },
];

const ACCESS: FeatureAccess[] = [
  { featureId: "messaging", practitionerSlug: "dr-ali" },
  { featureId: "messaging", practitionerSlug: "sara-malik" },
];

const LOGS: FeatureAccessLog[] = [
  { id: "fl_1", featureId: "video-sessions", practitionerSlug: null, action: "enabled_all", by: "Super Admin", at: "2026-09-01T09:00:00" },
  { id: "fl_2", featureId: "waitlist", practitionerSlug: null, action: "enabled_all", by: "Super Admin", at: "2026-09-01T09:00:00" },
  { id: "fl_3", featureId: "messaging", practitionerSlug: "dr-ali", action: "granted", by: "Super Admin", at: "2026-09-10T14:00:00" },
  { id: "fl_4", featureId: "messaging", practitionerSlug: "sara-malik", action: "granted", by: "Super Admin", at: "2026-09-12T11:00:00" },
];
let nextLogId = LOGS.length + 1;

function logAccess(featureId: string, practitionerSlug: string | null, action: FeatureLogAction, note?: string) {
  LOGS.unshift({
    id: `fl_${nextLogId++}`,
    featureId,
    practitionerSlug,
    action,
    by: "Super Admin",
    at: new Date().toISOString(),
    note,
  });
}

export async function getAllFeatures(): Promise<Feature[]> {
  return [...FEATURES];
}

export async function getFeatureById(id: string): Promise<Feature | null> {
  return FEATURES.find((f) => f.id === id) ?? null;
}

export async function getAccessForPractitioner(slug: string): Promise<string[]> {
  const overrides = ACCESS.filter((a) => a.practitionerSlug === slug).map((a) => a.featureId);
  const defaults = FEATURES.filter((f) => f.sharedByDefault).map((f) => f.id);
  return Array.from(new Set([...defaults, ...overrides]));
}

export async function getPractitionerSlugsWithAccess(featureId: string): Promise<string[]> {
  const feature = FEATURES.find((f) => f.id === featureId);
  const practitioners = await getAllPractitioners();
  const revoked = new Set(
    LOGS.filter((l) => l.featureId === featureId && l.practitionerSlug && l.action === "revoked")
      .map((l) => l.practitionerSlug as string),
  );
  const granted = new Set(ACCESS.filter((a) => a.featureId === featureId).map((a) => a.practitionerSlug));
  return practitioners
    .map((p) => p.slug)
    .filter((slug) => {
      if (granted.has(slug)) return true;
      if (revoked.has(slug)) return false;
      return feature?.sharedByDefault ?? false;
    });
}

export async function hasAccess(slug: string, featureId: string): Promise<boolean> {
  return (await getAccessForPractitioner(slug)).includes(featureId);
}

export async function grantAccess(slug: string, featureId: string): Promise<void> {
  if (!ACCESS.some((a) => a.practitionerSlug === slug && a.featureId === featureId)) {
    ACCESS.push({ featureId, practitionerSlug: slug });
  }
  logAccess(featureId, slug, "granted");
}

export async function revokeAccess(slug: string, featureId: string): Promise<void> {
  const index = ACCESS.findIndex((a) => a.practitionerSlug === slug && a.featureId === featureId);
  if (index !== -1) ACCESS.splice(index, 1);
  logAccess(featureId, slug, "revoked");
}

export async function grantAccessToAll(featureId: string): Promise<void> {
  const practitioners = await getAllPractitioners();
  for (const p of practitioners) {
    if (!ACCESS.some((a) => a.practitionerSlug === p.slug && a.featureId === featureId)) {
      ACCESS.push({ featureId, practitionerSlug: p.slug });
    }
  }
  const feature = FEATURES.find((f) => f.id === featureId);
  if (feature) feature.sharedByDefault = true;
  logAccess(featureId, null, "enabled_all");
}

export async function revokeAccessFromAll(featureId: string): Promise<void> {
  for (let i = ACCESS.length - 1; i >= 0; i--) {
    if (ACCESS[i].featureId === featureId) ACCESS.splice(i, 1);
  }
  const feature = FEATURES.find((f) => f.id === featureId);
  if (feature) feature.sharedByDefault = false;
  logAccess(featureId, null, "disabled_all");
}

export async function getFeatureLogs(featureId?: string): Promise<FeatureAccessLog[]> {
  return featureId ? LOGS.filter((l) => l.featureId === featureId) : [...LOGS];
}

/** Re-points a practitioner's feature access and its log entries at their new slug after a rename. */
export async function renameFeatureSlug(from: string, to: string): Promise<void> {
  for (const a of ACCESS) if (a.practitionerSlug === from) a.practitionerSlug = to;
  for (const l of LOGS) if (l.practitionerSlug === from) l.practitionerSlug = to;
}
