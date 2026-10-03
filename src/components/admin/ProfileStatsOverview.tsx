"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CalendarCheck, Eye, MousePointerClick, Users } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { PlatformStats, PractitionerStatsRow } from "@/data/profileStats";
import { STATS_RANGES } from "@/lib/statsRanges";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { SearchInput } from "./ui/Inputs";
import { EmptyState } from "./ui/Overlays";
import { KPI } from "./ui/Stat";
import { TopBar } from "./TopBar";

type SortKey = "name" | "views" | "visitors" | "requests" | "rate";

interface Line {
  p: Practitioner;
  views: number;
  previousViews: number;
  visitors: number;
  requests: number;
  confirmed: number;
  rate: number;
  topSource: string | null;
}

const count = (n: number) => n.toLocaleString("en-US");
const percent = (rate: number) => (rate <= 0 ? "—" : `${rate < 10 ? rate.toFixed(1) : Math.round(rate)}%`);

function Trend({ current, previous }: { current: number; previous: number }) {
  if (current === 0 && previous === 0) return <span className="subtle">—</span>;
  if (previous === 0) return <span style={{ fontSize: 11.5, color: "var(--ml-ink-subtle)" }}>new</span>;
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return <span style={{ fontSize: 11.5, color: "var(--ml-ink-subtle)" }}>±0%</span>;
  const up = change > 0;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, color: up ? "var(--ml-ok)" : "var(--ml-danger)", display: "inline-flex", alignItems: "center", gap: 2 }}>
      {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {Math.abs(change)}%
    </span>
  );
}

function SortHead({
  label,
  k,
  sort,
  onSort,
  align = "right",
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === k;
  return (
    <th style={{ textAlign: align }}>
      <button
        type="button"
        onClick={() => onSort(k)}
        style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, color: active ? "var(--ml-ink)" : undefined }}
      >
        {label}
        {active && (sort.dir === -1 ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
      </button>
    </th>
  );
}

export function ProfileStatsOverview({ practitioners, stats }: { practitioners: Practitioner[]; stats: PlatformStats }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "views", dir: -1 });

  const lines = useMemo<Line[]>(() => {
    const bySlug = new Map<string, PractitionerStatsRow>(stats.rows.map((r) => [r.slug, r]));
    return practitioners.map((p) => {
      const r = bySlug.get(p.slug);
      const visitors = r?.visitors ?? 0;
      const requests = r?.bookingRequests ?? 0;
      return {
        p,
        views: r?.views ?? 0,
        previousViews: r?.previousViews ?? 0,
        visitors,
        requests,
        confirmed: r?.confirmedBookings ?? 0,
        rate: visitors > 0 ? (requests / visitors) * 100 : 0,
        topSource: r?.topSource ?? null,
      };
    });
  }, [practitioners, stats.rows]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? lines.filter(
          (l) => l.p.fullName.toLowerCase().includes(needle) || l.p.professionalTitle.toLowerCase().includes(needle),
        )
      : lines;
    const value = (l: Line) =>
      sort.key === "name" ? l.p.fullName.toLowerCase()
      : sort.key === "views" ? l.views
      : sort.key === "visitors" ? l.visitors
      : sort.key === "requests" ? l.requests
      : l.rate;
    return [...filtered].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const order = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
      return order * sort.dir || a.p.fullName.localeCompare(b.p.fullName);
    });
  }, [lines, q, sort]);

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "name" ? 1 : -1 }));

  const withViews = lines.filter((l) => l.views > 0).length;

  return (
    <div>
      <TopBar
        title="Profile stats"
        subtitle="How each practitioner's public profile is performing"
        actions={
          <div className="tabs">
            {STATS_RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/profile-stats?range=${r}`}
                className={"tab" + (r === stats.range ? " active" : "")}
                aria-current={r === stats.range ? "true" : undefined}
              >
                {r} days
              </Link>
            ))}
          </div>
        }
      />

      <div style={{ padding: "0 32px 40px" }}>
        <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <KPI label="Profile views" value={count(stats.views)} icon={<Eye size={17} />} />
          <KPI label="Visitors" value={count(stats.visitors)} icon={<Users size={17} />} />
          <KPI label="Booking requests" value={count(stats.bookingRequests)} icon={<CalendarCheck size={17} />} />
          <KPI label="Profiles with views" value={`${withViews} / ${lines.length}`} icon={<MousePointerClick size={17} />} />
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--ml-border)", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="h2" style={{ fontSize: 15 }}>By practitioner</div>
              <div style={{ fontSize: 12, color: "var(--ml-ink-subtle)", marginTop: 1 }}>
                <span className="tnum">{shown.length}</span> of <span className="tnum">{lines.length}</span> shown · click a row for the full breakdown
              </div>
            </div>
            <SearchInput value={q} onChange={setQ} placeholder="Search by name or title…" width={260} />
          </div>

          {shown.length === 0 ? (
            <EmptyState title="No practitioners match" body="Try a different search term." />
          ) : (
            <div className="table-scroll scroll-y">
              <table className="table" style={{ border: "none" }}>
                <thead>
                  <tr>
                    <SortHead label="Practitioner" k="name" sort={sort} onSort={onSort} align="left" />
                    <th>Account</th>
                    <SortHead label="Views" k="views" sort={sort} onSort={onSort} />
                    <SortHead label="Visitors" k="visitors" sort={sort} onSort={onSort} />
                    <SortHead label="Requests" k="requests" sort={sort} onSort={onSort} />
                    <SortHead label="Booking rate" k="rate" sort={sort} onSort={onSort} />
                    <th className="hide-md">Top source</th>
                    <th style={{ textAlign: "right", paddingRight: 18 }} />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((l) => (
                    <tr key={l.p.slug} onClick={() => router.push(`/admin/profile-stats/${l.p.slug}`)}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={l.p.fullName} size="md" />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 500, color: "var(--ml-ink)" }}>{l.p.fullName}</div>
                            <div className="truncate" style={{ fontSize: 12, color: "var(--ml-ink-subtle)" }}>{l.p.professionalTitle}</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge kind={l.p.status} /></td>
                      <td style={{ textAlign: "right" }}>
                        <div className="tnum" style={{ fontWeight: 600 }}>{count(l.views)}</div>
                        <Trend current={l.views} previous={l.previousViews} />
                      </td>
                      <td className="tnum" style={{ textAlign: "right" }}>{count(l.visitors)}</td>
                      <td className="tnum" style={{ textAlign: "right" }}>
                        {count(l.requests)}
                        {l.confirmed > 0 && <span style={{ color: "var(--ml-ink-subtle)", fontSize: 12 }}> ({l.confirmed} ✓)</span>}
                      </td>
                      <td className="tnum" style={{ textAlign: "right" }}>{percent(l.rate)}</td>
                      <td className="hide-md">{l.topSource ?? <span className="subtle">—</span>}</td>
                      <td style={{ textAlign: "right", paddingRight: 18 }} onClick={(e) => e.stopPropagation()}>
                        <Link className="btn btn-sm" href={`/admin/profile-stats/${l.p.slug}`}><Eye size={13} />Details</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
