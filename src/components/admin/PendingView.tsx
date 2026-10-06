"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { SentBackRow } from "@/data/credentialQueue";
import { SearchInput } from "./ui/Inputs";
import { EmptyState } from "./ui/Overlays";
import { SlidingTabs } from "./ui/SlidingTabs";
import { TopBar } from "./TopBar";

// Dates are shown in UTC so the server and the browser always agree.
const formatDay = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

type TabId = "awaiting" | "sent_back";

const matches = (p: Practitioner, needle: string) =>
  !needle || p.fullName.toLowerCase().includes(needle) || p.email.toLowerCase().includes(needle) || p.professionalTitle.toLowerCase().includes(needle);

export function PendingView({ awaiting, sentBack }: { awaiting: Practitioner[]; sentBack: SentBackRow[] }) {
  const [tab, setTab] = useState<TabId>("awaiting");
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const awaitingShown = awaiting.filter((p) => matches(p, needle));
  const sentBackShown = sentBack.filter((r) => matches(r.p, needle));

  return (
    <div>
      <TopBar icon={ShieldCheck} title="Credential review" subtitle="Submitted credentials waiting for your decision, and those you have sent back" />

      <div style={{ padding: "0 var(--ml-gutter) 32px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "0 14px" }}>
            <SlidingTabs
              label="Credential review lists"
              tabs={[
                { id: "awaiting" as TabId, label: "Awaiting review", count: awaiting.length },
                { id: "sent_back" as TabId, label: "Sent back", count: sentBack.length },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--ml-border)", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "var(--ml-ink-muted)" }}>
              {tab === "awaiting" ? "Waiting for your decision, longest wait first" : "Waiting for the practitioner to submit again"}
            </div>
            {awaiting.length + sentBack.length > 0 && <SearchInput value={q} onChange={setQ} placeholder="Search by name, email or title…" width={280} />}
          </div>

          {tab === "awaiting" ? (
            awaiting.length === 0 ? (
              <EmptyState title="All caught up" body="Nobody is waiting for approval right now. New submissions appear here as soon as a practitioner sends in their credentials." />
            ) : awaitingShown.length === 0 ? (
              <EmptyState title="No one matches" body="Try a different name or email address." />
            ) : (
              <div className="table-scroll scroll-y tall">
                <table className="table roomy">
                  <thead>
                    <tr>
                      <th>Practitioner</th>
                      <th className="hide-md">Professional title</th>
                      <th className="hide-sm">Email</th>
                      <th>Submitted</th>
                      <th style={{ textAlign: "right", paddingRight: 18 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {awaitingShown.map((p) => (
                      <tr key={p.slug} style={{ cursor: "default" }}>
                        <td style={{ fontWeight: 500, color: "var(--ml-ink)" }}>{p.fullName}</td>
                        <td className="hide-md">{p.professionalTitle}</td>
                        <td className="hide-sm" style={{ color: "var(--ml-ink-muted)" }}>{p.email}</td>
                        <td className="tnum" style={{ whiteSpace: "nowrap" }}>{formatDay(p.verificationSubmittedAt)}</td>
                        <td style={{ textAlign: "right", paddingRight: 18 }}>
                          <Link className="btn btn-lg btn-primary" href={`/admin/pending/${p.slug}`}>Review</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : sentBack.length === 0 ? (
            <EmptyState title="Nothing sent back" body="Practitioners you send back for changes appear here until they submit again." />
          ) : sentBackShown.length === 0 ? (
            <EmptyState title="No one matches" body="Try a different name or email address." />
          ) : (
            <div className="table-scroll scroll-y tall">
              <table className="table roomy">
                <thead>
                  <tr>
                    <th>Practitioner</th>
                    <th className="hide-md">Professional title</th>
                    <th className="hide-sm">Email</th>
                    <th>Sent back</th>
                    <th className="hide-sm">Times</th>
                    <th style={{ textAlign: "right", paddingRight: 18 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sentBackShown.map(({ p, sentBackAt, rounds }) => (
                    <tr key={p.slug} style={{ cursor: "default" }}>
                      <td style={{ fontWeight: 500, color: "var(--ml-ink)" }}>{p.fullName}</td>
                      <td className="hide-md">{p.professionalTitle}</td>
                      <td className="hide-sm" style={{ color: "var(--ml-ink-muted)" }}>{p.email}</td>
                      <td className="tnum" style={{ whiteSpace: "nowrap" }}>{formatDay(sentBackAt)}</td>
                      <td className="hide-sm tnum">{rounds}</td>
                      <td style={{ textAlign: "right", paddingRight: 18 }}>
                        <Link className="btn btn-lg btn-primary" href={`/admin/pending/${p.slug}`}>View</Link>
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
