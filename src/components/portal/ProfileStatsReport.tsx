import type { ReactNode } from "react";
import { BarChart3, Globe2, Share2 } from "lucide-react";
import type { ProfileStats } from "@/data/profileStats";
import { SettingsCard } from "@/components/portal/SettingsCard";
import { CountrySummary, SourcesList } from "@/components/portal/StatsBreakdowns";
import { ViewsChart } from "@/components/portal/ViewsChart";

export const formatCount = (n: number) => n.toLocaleString("en-US");

export function formatRate(requests: number, visitors: number): string {
  if (visitors <= 0) return "—";
  const rate = (requests / visitors) * 100;
  return `${rate < 10 ? rate.toFixed(1) : Math.round(rate)}%`;
}

/** Percentage change against the previous period, coloured by direction. */
export function Delta({ current, previous, range }: { current: number; previous: number; range: number }) {
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

export function StatTile({ label, value, footer }: { label: string; value: string; footer: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl bg-surface px-4 py-4 ring-1 ring-black/[0.07] sm:px-6 sm:py-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-[32px] leading-none sm:text-[40px] font-bold tracking-tight">{value}</p>
      <p className="mt-3 text-xs">{footer}</p>
    </div>
  );
}

/**
 * One practitioner's profile stats: tiles, views per day, and the breakdowns. Shared by the practitioner's
 * own Stats page and the Super Admin's per-practitioner page, so both always show the same numbers.
 */
export function ProfileStatsReport({
  stats,
  audience,
  slug,
}: {
  stats: ProfileStats;
  audience: "practitioner" | "admin";
  slug: string;
}) {
  const { range } = stats;
  const hasViews = stats.views > 0;
  const mine = audience === "practitioner";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Profile views"
          value={formatCount(stats.views)}
          footer={<Delta current={stats.views} previous={stats.previousViews} range={range} />}
        />
        <StatTile
          label="Visitors"
          value={formatCount(stats.visitors)}
          footer={<Delta current={stats.visitors} previous={stats.previousVisitors} range={range} />}
        />
        <StatTile
          label="Appointment requests"
          value={formatCount(stats.bookingRequests)}
          footer={<span className="text-muted">{formatCount(stats.confirmedBookings)} confirmed</span>}
        />
        <StatTile
          label="Appointment rate"
          value={formatRate(stats.bookingRequests, stats.visitors)}
          footer={<span className="text-muted">Visitors who requested an appointment</span>}
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
                {mine
                  ? "Share your profile link on Instagram, WhatsApp or your website and the numbers will start to appear here. Your own visits aren't counted."
                  : "Nobody has opened this practitioner's public profile in this period."}
              </p>
              <p className="mt-4 text-sm font-medium text-primary">/{slug}</p>
            </div>
          )}
        </div>
      </SettingsCard>

      {hasViews && (
        <div className="grid gap-8 lg:grid-cols-2">
          <SettingsCard icon={<Share2 className="size-[18px]" aria-hidden />} title="Where visitors come from">
            <SourcesList rows={stats.sources} total={stats.views} />
          </SettingsCard>
          <SettingsCard icon={<Globe2 className="size-[18px]" aria-hidden />} title="Top countries">
            <CountrySummary rows={stats.countries} total={stats.views} />
          </SettingsCard>
        </div>
      )}
    </div>
  );
}
