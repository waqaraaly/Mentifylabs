import { BarChart3 } from "lucide-react";
import { getCurrentPractitioner } from "@/data/practitioners";
import { getProfileStats, STATS_RANGES, type StatsPeriod } from "@/data/profileStats";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProfileStatsReport } from "@/components/portal/ProfileStatsReport";
import { RangeSelect } from "@/components/portal/RangeSelect";

export const metadata = { title: "Profile stats" };

function parseRange(value: string | string[] | undefined): StatsPeriod {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "all") return "all";
  const n = Number(raw);
  return (STATS_RANGES as readonly number[]).includes(n) ? (n as StatsPeriod) : 30;
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
            options={[
              ...STATS_RANGES.map((r) => ({ value: r, label: `Last ${r} days`, href: `/dashboard/stats?range=${r}` })),
              { value: "all", label: "All time", href: "/dashboard/stats?range=all" },
            ]}
          />
        }
      />

      <ProfileStatsReport stats={stats} audience="practitioner" />
    </div>
  );
}
