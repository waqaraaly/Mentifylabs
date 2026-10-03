import { BarChart3 } from "lucide-react";
import { getCurrentPractitioner } from "@/data/practitioners";
import { getProfileStats, STATS_RANGES, type StatsRange } from "@/data/profileStats";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProfileStatsReport } from "@/components/portal/ProfileStatsReport";
import { RangeSelect } from "@/components/portal/RangeSelect";

export const metadata = { title: "Profile stats" };

function parseRange(value: string | string[] | undefined): StatsRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (STATS_RANGES as readonly number[]).includes(n) ? (n as StatsRange) : 30;
}

export default async function StatsPage({ searchParams }: PageProps<"/dashboard/stats">) {
  const practitioner = await getCurrentPractitioner();
  const range = parseRange((await searchParams).range);
  const stats = await getProfileStats(practitioner.slug, range);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-2 pb-12 sm:px-4">
      <PageHeader
        icon={BarChart3}
        title="Profile stats"
        description="How many people open your public profile, where they come from, and how many go on to book."
        actions={
          <RangeSelect
            value={range}
            options={STATS_RANGES.map((r) => ({ value: r, label: `Last ${r} days`, href: `/dashboard/stats?range=${r}` }))}
          />
        }
      />

      <ProfileStatsReport stats={stats} audience="practitioner" slug={practitioner.slug} />
    </div>
  );
}
