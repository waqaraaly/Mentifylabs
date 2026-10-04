import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LineChart } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getAllPractitioners } from "@/data/practitioners";
import { getProfileStats, STATS_RANGES, type StatsRange } from "@/data/profileStats";
import { ProfileStatsReport } from "@/components/portal/ProfileStatsReport";
import { RangeSelect } from "@/components/portal/RangeSelect";
import { TopBar } from "@/components/admin/TopBar";

function parseRange(value: string | string[] | undefined): StatsRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (STATS_RANGES as readonly number[]).includes(n) ? (n as StatsRange) : 30;
}

export async function generateMetadata({ params }: PageProps<"/admin/profile-stats/[slug]">) {
  const { slug } = await params;
  const practitioner = (await getAllPractitioners()).find((p) => p.slug === slug);
  return { title: practitioner ? `${practitioner.fullName} — profile stats` : "Profile stats" };
}

/** The same report the practitioner sees on their own Stats page, so both always show exactly the same thing. */
export default async function AdminPractitionerStatsPage({
  params,
  searchParams,
}: PageProps<"/admin/profile-stats/[slug]">) {
  await requireAdmin();
  const { slug } = await params;
  const practitioner = (await getAllPractitioners()).find((p) => p.slug === slug);
  if (!practitioner) notFound();

  const range = parseRange((await searchParams).range);
  const stats = await getProfileStats(slug, range);

  return (
    <div>
      <TopBar
        icon={LineChart}
        title="Profile stats"
        subtitle={`How ${practitioner.fullName}'s public profile is performing`}
        actions={
          <>
            <Link className="btn btn-sm" href="/admin/profile-stats">
              <ArrowLeft size={13} />All practitioners
            </Link>
            <RangeSelect
              value={range}
              options={STATS_RANGES.map((r) => ({ value: r, label: `Last ${r} days`, href: `/admin/profile-stats/${slug}?range=${r}` }))}
            />
          </>
        }
      />
      <div style={{ padding: "0 var(--ml-gutter) 40px" }}>
        <ProfileStatsReport stats={stats} audience="admin" slug={slug} />
      </div>
    </div>
  );
}
