"use client";

import Link from "next/link";
import { useState } from "react";
import { BarChart3 } from "lucide-react";
import type { PersonRow, Report } from "@/lib/reportMetrics";
import { REPORT_RANGES } from "@/lib/reportRanges";
import { GrowthChart } from "./ui/charts";
import { FilterSelect } from "./ui/Inputs";
import { EmptyState } from "./ui/Overlays";
import { TopBar } from "./TopBar";

const RANGE_LABEL: Record<string, string> = { 30: "30 days", 90: "90 days", 180: "6 months", 365: "12 months", all: "All time" };

const days = (d: number | null) => (d === null ? "—" : d < 1 ? "under a day" : `${d.toFixed(1)} days`);

/** What an owner wants to know: are people joining and becoming useful, are reviews keeping up, and are clients arriving. */
export function ReportsView({ report }: { report: Report }) {
  // How the period reads inside a sentence: "in the last 30 days", or "so far" for all time.
  const inPeriod = report.allTime ? "so far" : `in the last ${RANGE_LABEL[report.range] ?? `${report.range} days`}`;
  const { funnel, review, conversion } = report;
  const isActive = (r: (typeof REPORT_RANGES)[number]) => (r === "all" ? report.allTime : !report.allTime && r === report.range);
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
              <Link key={r} href={`/admin/reports?range=${r}`} className={"tab" + (isActive(r) ? " active" : "")} aria-current={isActive(r) ? "true" : undefined}>
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
            <small>{review.approved} approved {inPeriod}</small>
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
            {start === 0 ? `Nobody has signed up ${inPeriod}.` : `The ${start} ${start === 1 ? "person" : "people"} who signed up ${inPeriod}, and how far they got.`}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
            {funnel.stages.map((stage) => (
              <div key={stage.key} style={{ display: "grid", gridTemplateColumns: "200px minmax(0, 1fr) 150px", gap: 18, alignItems: "center" }}>
                <div style={{ fontSize: 14, color: "var(--ml-ink)" }}>{stage.label}</div>
                <div style={{ height: 14, background: "var(--ml-surface-3)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${start ? (stage.count / start) * 100 : 0}%`, height: "100%", background: "var(--ml-accent)", borderRadius: 999, minWidth: stage.count ? 6 : 0 }} />
                </div>
                <div className="tnum" style={{ fontSize: 13.5, textAlign: "right" }}>
                  <strong>{stage.count}</strong>
                  <span style={{ color: "var(--ml-ink-muted)" }}> · {start ? Math.round((stage.count / start) * 100) : 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--ml-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div className="h2">Practitioner growth</div>
              <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginTop: 3 }}>How many practitioners there were at the end of each of the last 12 months</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="tnum" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1 }}>{report.totals.practitioners}</div>
              <div style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", marginTop: 4 }}>in total today</div>
            </div>
          </div>
          <div style={{ padding: "20px 22px 12px" }}>
            <GrowthChart data={report.growth} />
          </div>
        </div>

        <FollowUp report={report} inPeriod={inPeriod} />
      </div>
    </div>
  );
}

type FollowUpId = "notSubmitted" | "verifiedNotLive" | "liveNoAppointments" | "dormant" | "cannotSignIn" | "mostRequested" | "mostVisited";

/** One filter per reason a practitioner might need a look, in the order of their journey (can't get in, not verified, not live, live but unused, gone quiet), then the two rankings. */
const FOLLOW_UP: { id: FollowUpId; label: string; about: (inPeriod: string, count: number) => string; empty: string }[] = [
  { id: "cannotSignIn", label: "Never signed in", about: () => "Signed up or invited, but haven't confirmed their email or used their invite, so they have never been able to sign in", empty: "Everyone has signed in at least once" },
  { id: "notSubmitted", label: "Verification not submitted", about: () => "Active accounts that have not sent in their credentials yet", empty: "Everyone active has submitted their credentials" },
  { id: "verifiedNotLive", label: "Verified, not live", about: () => "Verified practitioners who have not published their profile", empty: "Every verified practitioner is live" },
  { id: "liveNoAppointments", label: "Live, no appointments", about: () => "Live profiles that have never received a request", empty: "Every live profile has had a request" },
  { id: "dormant", label: "Gone quiet", about: () => "Live profiles whose owner last signed in more than a month ago", empty: "Everyone live has signed in within the last month" },
  {
    id: "mostRequested",
    label: "Most requested",
    about: (inPeriod, count) => `The ${count === 1 ? "practitioner" : `${count} practitioners`} with the most appointment requests ${inPeriod}`,
    empty: "No appointments have been requested in this period",
  },
  {
    id: "mostVisited",
    label: "Most visitors",
    about: (inPeriod, count) => `The ${count === 1 ? "practitioner" : `${count} practitioners`} whose profile had the most visitors ${inPeriod}`,
    empty: "Nobody visited a profile in this period",
  },
];

/** Practitioners to look at, filtered by reason from a dropdown. Opens on the first reason that has anyone in it. */
function FollowUp({ report, inPeriod }: { report: Report; inPeriod: string }) {
  const lists: Record<FollowUpId, PersonRow[]> = {
    notSubmitted: report.notSubmitted,
    verifiedNotLive: report.verifiedNotLive,
    liveNoAppointments: report.liveNoAppointments,
    dormant: report.dormant,
    cannotSignIn: report.cannotSignIn,
    mostVisited: report.mostVisited,
    mostRequested: report.concentration.top.map((t) => ({ slug: t.slug, name: t.name, title: t.title, note: `${t.count} ${t.count === 1 ? "request" : "requests"}` })),
  };
  const first = FOLLOW_UP.find((f) => lists[f.id].length > 0)?.id ?? FOLLOW_UP[0].id;
  const [active, setActive] = useState<FollowUpId>(first);
  const current = FOLLOW_UP.find((f) => f.id === active)!;
  const rows = lists[active];

  return (
    // Not clipped, so the dropdown's menu can open past the edge of the card.
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--ml-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div className="h2">Practitioner watchlist</div>
          <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginTop: 3 }}>{current.about(inPeriod, rows.length)}</div>
        </div>
        <FilterSelect
          value={active}
          onChange={(v) => setActive(v as FollowUpId)}
          options={FOLLOW_UP.map((f) => ({ value: f.id, label: `${f.label} (${lists[f.id].length})` }))}
          width={270}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState title={current.empty} />
      ) : (
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {rows.map((p, i) => (
            <div
              key={p.slug}
              style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto auto", gap: 16, alignItems: "center", padding: "14px 22px", borderBottom: i === rows.length - 1 ? "none" : "1px solid rgba(0, 0, 0, 0.06)" }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="truncate" style={{ fontWeight: 500, fontSize: 14.85, color: "var(--ml-ink)" }}>{p.name}</div>
                <div className="truncate" style={{ fontSize: 12.5, color: "var(--ml-ink-subtle)" }}>{p.title}</div>
              </div>
              <span style={{ fontSize: 13, color: "var(--ml-ink-muted)", whiteSpace: "nowrap" }}>{p.note}</span>
              <Link className="btn btn-sm" href={`/admin/practitioners/${p.slug}`}>View profile</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
