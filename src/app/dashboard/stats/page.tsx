import Link from "next/link";
import { BarChart3, ExternalLink, Globe2, MonitorSmartphone, Share2, Users } from "lucide-react";
import { getCurrentPractitioner } from "@/data/practitioners";
import { getProfileStats, STATS_RANGES, type BreakdownRow, type StatsRange } from "@/data/profileStats";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsCard } from "@/components/portal/SettingsCard";
import { ViewsChart } from "@/components/portal/ViewsChart";

export const metadata = { title: "Profile stats" };

const number = (n: number) => n.toLocaleString("en-US");

function parseRange(value: string | string[] | undefined): StatsRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (STATS_RANGES as readonly number[]).includes(n) ? (n as StatsRange) : 30;
}

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

const DEVICE_LABELS: Record<string, string> = { mobile: "Mobile", desktop: "Desktop", tablet: "Tablet" };

function Delta({ current, previous, range }: { current: number; previous: number; range: number }) {
  if (previous === 0 && current === 0) return <span className="text-muted">No change</span>;
  if (previous === 0) return <span className="text-muted">New vs the previous {range} days</span>;
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return <span className="text-muted">Same as the previous {range} days</span>;
  return (
    <span className="text-muted">
      <span className={`font-medium ${change > 0 ? "text-success" : "text-alert"}`}>
        {change > 0 ? "+" : ""}
        {change}%
      </span>{" "}
      vs the previous {range} days
    </span>
  );
}

function StatTile({ label, value, footer }: { label: string; value: string; footer: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface px-6 py-5 ring-1 ring-black/[0.07]">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-[40px] leading-none font-bold tracking-tight">{value}</p>
      <p className="mt-3 text-xs">{footer}</p>
    </div>
  );
}

/** Horizontal bars, one hue, the value at the tip of each. */
function BreakdownBars({ rows, total, emptyText }: { rows: BreakdownRow[]; total: number; emptyText: string }) {
  if (rows.length === 0) return <p className="px-6 py-6 text-sm text-muted">{emptyText}</p>;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <ul className="space-y-4 px-6 py-5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{row.label}</span>
            <span className="shrink-0 tabular-nums">
              <span className="font-semibold">{number(row.count)}</span>
              <span className="ml-1.5 text-xs text-muted">{Math.round((row.count / total) * 100)}%</span>
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-r-[4px] bg-primary/[0.12]">
            <div className="h-full rounded-r-[4px] bg-primary" style={{ width: `${Math.max(2, (row.count / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function StatsPage({ searchParams }: PageProps<"/dashboard/stats">) {
  const practitioner = await getCurrentPractitioner();
  const range = parseRange((await searchParams).range);
  const stats = await getProfileStats(practitioner.slug, range);

  const conversion = stats.visitors > 0 ? (stats.bookingRequests / stats.visitors) * 100 : 0;
  const hasViews = stats.views > 0;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-2 pb-12 sm:px-4">
      <PageHeader
        icon={BarChart3}
        title="Profile stats"
        description="How many people open your public profile, where they come from, and how many go on to book."
        actions={
          <Link
            href={`/${practitioner.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold ring-1 ring-black/[0.14] transition hover:bg-black/[0.04]"
          >
            View public profile
            <ExternalLink className="size-4" aria-hidden />
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Time range">
        {STATS_RANGES.map((r) => (
          <Link
            key={r}
            href={`/dashboard/stats?range=${r}`}
            aria-current={r === range ? "true" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              r === range ? "bg-primary text-primary-foreground" : "ring-1 ring-black/[0.14] hover:bg-black/[0.04]"
            }`}
          >
            Last {r} days
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Profile views"
          value={number(stats.views)}
          footer={<Delta current={stats.views} previous={stats.previousViews} range={range} />}
        />
        <StatTile
          label="Visitors"
          value={number(stats.visitors)}
          footer={<Delta current={stats.visitors} previous={stats.previousVisitors} range={range} />}
        />
        <StatTile
          label="Booking requests"
          value={number(stats.bookingRequests)}
          footer={<span className="text-muted">{number(stats.confirmedBookings)} confirmed</span>}
        />
        <StatTile
          label="Booking rate"
          value={stats.visitors > 0 ? `${conversion < 10 ? conversion.toFixed(1) : Math.round(conversion)}%` : "—"}
          footer={<span className="text-muted">Visitors who requested a session</span>}
        />
      </div>

      <SettingsCard icon={<BarChart3 className="size-[18px]" aria-hidden />} title="Views per day">
        <div className="px-6 py-5">
          {hasViews ? (
            <ViewsChart data={stats.daily} />
          ) : (
            <div className="py-10 text-center">
              <p className="font-medium">No views in the last {range} days yet</p>
              <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted">
                Share your profile link on Instagram, WhatsApp or your website and the numbers will start to appear
                here. Your own visits aren&apos;t counted.
              </p>
              <p className="mt-4 text-sm font-medium text-primary">/{practitioner.slug}</p>
            </div>
          )}
        </div>
      </SettingsCard>

      {hasViews && (
        <div className="grid gap-8 lg:grid-cols-2">
          <SettingsCard icon={<Share2 className="size-[18px]" aria-hidden />} title="Where visitors come from">
            <BreakdownBars rows={stats.sources} total={stats.views} emptyText="No data yet." />
          </SettingsCard>
          <SettingsCard icon={<Globe2 className="size-[18px]" aria-hidden />} title="Top countries">
            <BreakdownBars
              rows={stats.countries.map((c) => ({ ...c, label: countryName(c.label) }))}
              total={stats.views}
              emptyText="Location isn't available for these visits."
            />
          </SettingsCard>
          <SettingsCard icon={<MonitorSmartphone className="size-[18px]" aria-hidden />} title="Devices">
            <BreakdownBars
              rows={stats.devices.map((d) => ({ ...d, label: DEVICE_LABELS[d.label] ?? d.label }))}
              total={stats.views}
              emptyText="No data yet."
            />
          </SettingsCard>
          <SettingsCard icon={<Users className="size-[18px]" aria-hidden />} title="From view to booking">
            <BreakdownBars
              rows={[
                { label: "Visitors", count: stats.visitors },
                { label: "Requested a session", count: stats.bookingRequests },
                { label: "Confirmed", count: stats.confirmedBookings },
              ].filter((r, i) => i === 0 || r.count > 0)}
              total={Math.max(stats.visitors, 1)}
              emptyText="No data yet."
            />
          </SettingsCard>
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted">
        Counts are approximate. A &quot;view&quot; is one visit to your profile, and a visitor who comes back on another
        day is counted again. We don&apos;t store IP addresses or follow people across sites. Times are in UTC.
      </p>
    </div>
  );
}
