"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import type { PersonRow, Report } from "@/lib/reportMetrics";
import { REPORT_RANGES } from "@/lib/reportRanges";
import { GrowthChart } from "./ui/charts";
import { EmptyState } from "./ui/Overlays";
import { TopBar } from "./TopBar";

const RANGE_LABEL: Record<number, string> = { 30: "30 days", 90: "90 days", 365: "12 months" };

const days = (d: number | null) => (d === null ? "—" : d < 1 ? "under a day" : `${d.toFixed(1)} days`);

/** What an owner wants to know: are people joining and becoming useful, are reviews keeping up, and are clients arriving. */
export function ReportsView({ report }: { report: Report }) {
  const router = useRouter();
  const open = (slug: string) => router.push(`/admin/practitioners/${slug}`);
  const period = RANGE_LABEL[report.range] ?? `${report.range} days`;
  const { funnel, review, conversion, concentration } = report;
  const start = funnel.cohort;

  return (
    <div>
      <TopBar
        icon={BarChart3}
        title="Reports"
        subtitle="How the platform is doing: sign-ups, reviews and appointments"
        actions={
          <div className="tabs">
            {REPORT_RANGES.map((r) => (
              <Link key={r} href={`/admin/reports?range=${r}`} className={"tab" + (r === report.range ? " active" : "")} aria-current={r === report.range ? "true" : undefined}>
                {RANGE_LABEL[r]}
              </Link>
            ))}
          </div>
        }
      />

      <div style={{ padding: "0 var(--ml-gutter) 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* The four numbers worth checking first */}
        <div className="card metric-strip cols-4">
          <div>
            <div className="tnum">{report.totals.live}</div>
            <span>Live practitioners</span>
            <small>of {report.totals.practitioners} in total</small>
          </div>
          <div>
            <div className="tnum">{review.waiting}</div>
            <span>Awaiting review</span>
            <small>{review.oldestWaitDays === null ? "Nobody is waiting" : `Oldest has waited ${days(review.oldestWaitDays)}`}</small>
          </div>
          <div>
            <div className="tnum">{review.averageDaysToApprove === null ? "—" : review.averageDaysToApprove < 1 ? "<1" : review.averageDaysToApprove.toFixed(1)}</div>
            <span>Days to approve</span>
            <small>{review.approved} approved in {period}</small>
          </div>
          <div>
            <div className="tnum">{conversion.rate === null ? "—" : `${conversion.rate < 10 ? conversion.rate.toFixed(1) : Math.round(conversion.rate)}%`}</div>
            <span>Visitor to request</span>
            <small>{conversion.requests} requests from {conversion.visitors} visitors</small>
          </div>
        </div>

        {/* Where new practitioners are lost on the way to a first appointment */}
        <div className="card" style={{ padding: 22 }}>
          <div className="h2">Onboarding funnel</div>
          <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginTop: 3 }}>
            {start === 0 ? `Nobody signed up in the last ${period}.` : `The ${start} ${start === 1 ? "person" : "people"} who signed up in the last ${period}, and how far they got.`}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
            {funnel.stages.map((stage, i) => {
              const previous = i === 0 ? stage.count : funnel.stages[i - 1].count;
              const lost = previous - stage.count;
              return (
                <div key={stage.key} style={{ display: "grid", gridTemplateColumns: "200px minmax(0, 1fr) 150px", gap: 18, alignItems: "center" }}>
                  <div style={{ fontSize: 14, color: "var(--ml-ink)" }}>{stage.label}</div>
                  <div style={{ height: 14, background: "var(--ml-surface-3)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${start ? (stage.count / start) * 100 : 0}%`, height: "100%", background: "var(--ml-accent)", borderRadius: 999, minWidth: stage.count ? 6 : 0 }} />
                  </div>
                  <div className="tnum" style={{ fontSize: 13.5, textAlign: "right" }}>
                    <strong>{stage.count}</strong>
                    <span style={{ color: "var(--ml-ink-muted)" }}> · {start ? Math.round((stage.count / start) * 100) : 0}%</span>
                    {lost > 0 && <span style={{ color: "var(--ml-danger)" }}> · −{lost}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }} className="pair-grid">
          <div className="card" style={{ padding: 22 }}>
            <div className="h2">Joined, and live today</div>
            <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginTop: 3 }}>For each month, how many joined and how many of them are live now</div>
            <div style={{ display: "flex", gap: 18, fontSize: 12.5, marginTop: 12, color: "var(--ml-ink-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, background: "var(--ml-accent)", borderRadius: 50 }} />Joined</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 0, borderTop: "1.5px dashed var(--ml-ink-faint)" }} />Live today</span>
            </div>
            <div style={{ marginTop: 14 }}>
              <GrowthChart data={report.growth} />
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div className="h2">Review queue</div>
            <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginTop: 3 }}>How fast credentials get a decision</div>
            <dl style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "14px 16px", margin: "20px 0 0", fontSize: 14 }}>
              <dt style={{ color: "var(--ml-ink-muted)" }}>Waiting now</dt>
              <dd className="tnum" style={{ margin: 0, fontWeight: 600 }}>{review.waiting}</dd>
              <dt style={{ color: "var(--ml-ink-muted)" }}>Longest wait</dt>
              <dd className="tnum" style={{ margin: 0, fontWeight: 600 }}>{days(review.oldestWaitDays)}</dd>
              <dt style={{ color: "var(--ml-ink-muted)" }}>Average time to approve</dt>
              <dd className="tnum" style={{ margin: 0, fontWeight: 600 }}>{days(review.averageDaysToApprove)}</dd>
              <dt style={{ color: "var(--ml-ink-muted)" }}>Approved in {period}</dt>
              <dd className="tnum" style={{ margin: 0, fontWeight: 600 }}>{review.approved}</dd>
              <dt style={{ color: "var(--ml-ink-muted)" }}>Sent back in {period}</dt>
              <dd className="tnum" style={{ margin: 0, fontWeight: 600 }}>{review.sentBack}</dd>
            </dl>
          </div>
        </div>

        {/* How much of the demand sits with a few people */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--ml-border)" }}>
            <div className="h2">Where the appointments go</div>
            <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginTop: 3 }}>
              {concentration.top3Share === null
                ? `No appointments were requested in the last ${period}.`
                : `The top 3 practitioners carry ${concentration.top3Share}% of the ${concentration.total} appointments requested in the last ${period}.`}
            </div>
          </div>
          {concentration.top.map((row, i) => (
            <div
              key={row.slug}
              onClick={() => open(row.slug)}
              style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1.4fr) minmax(0, 1fr) 90px", gap: 16, alignItems: "center", padding: "14px 22px", cursor: "pointer", borderBottom: i === concentration.top.length - 1 ? "none" : "1px solid rgba(0, 0, 0, 0.06)" }}
            >
              <span className="tnum" style={{ color: "var(--ml-ink-subtle)", fontSize: 13 }}>{i + 1}</span>
              <div style={{ minWidth: 0 }}>
                <div className="truncate" style={{ fontWeight: 500, color: "var(--ml-ink)" }}>{row.name}</div>
                <div className="truncate" style={{ fontSize: 12.5, color: "var(--ml-ink-subtle)" }}>{row.title}</div>
              </div>
              <div style={{ height: 8, background: "var(--ml-surface-3)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${row.share}%`, height: "100%", background: "var(--ml-accent)", borderRadius: 999 }} />
              </div>
              <div className="tnum" style={{ textAlign: "right", fontSize: 13.5 }}>
                <strong>{row.count}</strong> <span style={{ color: "var(--ml-ink-muted)" }}>· {row.share}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* People to look at */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          <ListCard title="Gone quiet" subtitle="Live, but no appointment or sign-in for a month" items={report.dormant} empty="Everyone live has been active lately" onOpen={open} />
          <ListCard title="Live, no appointments yet" subtitle="Live profiles that never received a request" items={report.liveNoAppointments} empty="Every live profile has had a request" onOpen={open} />
          <ListCard title="Not live yet" subtitle="Active accounts and the step they are stuck on" items={report.stuck} empty="Everyone active is live" onOpen={open} />
        </div>
      </div>
    </div>
  );
}

function ListCard({
  title, subtitle, items, empty, onOpen,
}: {
  title: string;
  subtitle: string;
  items: PersonRow[];
  empty: string;
  onOpen: (slug: string) => void;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", alignSelf: "start" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ml-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="h2">{title}</div>
          <div style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", marginTop: 3 }}>{subtitle}</div>
        </div>
        <span className="tnum" style={{ fontSize: 14, fontWeight: 600 }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <EmptyState title={empty} />
      ) : (
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {items.map((p, i) => (
            <div
              key={p.slug}
              onClick={() => onOpen(p.slug)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", borderBottom: i === items.length - 1 ? "none" : "1px solid rgba(0, 0, 0, 0.06)" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="truncate" style={{ fontWeight: 500, color: "var(--ml-ink)" }}>{p.name}</div>
                <div className="truncate" style={{ fontSize: 12.5, color: "var(--ml-ink-subtle)" }}>{p.title}</div>
              </div>
              <span style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", whiteSpace: "nowrap" }}>{p.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
