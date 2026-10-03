import { requireAdmin } from "@/lib/session";
import { getAllPractitioners } from "@/data/practitioners";
import { getPlatformStats, STATS_RANGES, type StatsRange } from "@/data/profileStats";
import { ProfileStatsOverview } from "@/components/admin/ProfileStatsOverview";

export const metadata = { title: "Profile stats" };

function parseRange(value: string | string[] | undefined): StatsRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (STATS_RANGES as readonly number[]).includes(n) ? (n as StatsRange) : 30;
}

export default async function AdminProfileStatsPage({ searchParams }: PageProps<"/admin/profile-stats">) {
  await requireAdmin();
  const range = parseRange((await searchParams).range);
  const [practitioners, stats] = await Promise.all([getAllPractitioners(), getPlatformStats(range)]);

  return <ProfileStatsOverview practitioners={practitioners} stats={stats} />;
}
