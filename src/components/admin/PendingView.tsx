"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, FileText, Clock } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import { daysSinceSubmitted } from "@/lib/verification";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { SearchInput } from "./ui/Inputs";
import { EmptyState } from "./ui/Overlays";
import { TopBar } from "./TopBar";

const formatDay = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

function waiting(days: number | null) {
  if (days === null) return "";
  if (days <= 0) return "Today";
  return days === 1 ? "1 day" : `${days} days`;
}

export function PendingView({ queue, documentCounts }: { queue: Practitioner[]; documentCounts: Record<string, number> }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return queue;
    return queue.filter(
      (p) =>
        p.fullName.toLowerCase().includes(needle) ||
        p.email.toLowerCase().includes(needle) ||
        p.professionalTitle.toLowerCase().includes(needle),
    );
  }, [queue, q]);

  return (
    <div>
      <TopBar icon={Clock} title="Pending approval" subtitle="Practitioners who have submitted their credentials and are waiting for your decision" />

      <div style={{ padding: "0 var(--ml-gutter) 32px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ml-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="h2">Review queue</div>
              <div style={{ fontSize: 12, color: "var(--ml-ink-subtle)", marginTop: 2 }}>
                {q.trim()
                  ? <><span className="tnum">{shown.length}</span> of <span className="tnum">{queue.length}</span> match</>
                  : <>{queue.length} awaiting approval · longest wait first</>}
              </div>
            </div>
            {queue.length > 0 && (
              <SearchInput value={q} onChange={setQ} placeholder="Search by name or email…" width={280} />
            )}
          </div>
          {queue.length === 0 ? (
            <EmptyState title="All caught up" body="Nobody is waiting for approval right now. New submissions appear here as soon as a practitioner sends in their credentials." />
          ) : shown.length === 0 ? (
            <EmptyState title="No one matches" body="Try a different name or email address." />
          ) : (
            <div className="scroll-list">
              {shown.map((p, i) => {
                const docs = documentCounts[p.slug] ?? 0;
                const days = daysSinceSubmitted(p.verificationSubmittedAt);
                return (
                  <div
                    key={p.slug}
                    onClick={() => router.push(`/admin/pending/${p.slug}`)}
                    className="list-row"
                    style={{ cursor: "pointer", borderBottom: i === shown.length - 1 ? "none" : undefined }}
                  >
                    <Avatar name={p.fullName} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }} className="truncate">{p.fullName}</div>
                      <div className="truncate" style={{ fontSize: 12, color: "var(--ml-ink-muted)", marginTop: 2 }}>{p.professionalTitle}</div>
                      <div className="truncate" style={{ fontSize: 12, color: "var(--ml-ink-subtle)", marginTop: 1 }}>{p.email}</div>
                    </div>
                    <span className="hide-sm" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--ml-ink-muted)" }}>
                      <FileText size={13} />{docs} {docs === 1 ? "document" : "documents"}
                    </span>
                    <div className="hide-sm" style={{ textAlign: "right", minWidth: 96 }}>
                      <div className="tnum" style={{ fontSize: 12.5, color: "var(--ml-ink-2)" }}>{formatDay(p.verificationSubmittedAt)}</div>
                      <div style={{ fontSize: 11.5, color: days !== null && days >= 3 ? "var(--ml-warn)" : "var(--ml-ink-subtle)", marginTop: 1, fontWeight: days !== null && days >= 3 ? 600 : 400 }}>
                        Waiting {waiting(days)}
                      </div>
                    </div>
                    <Badge kind="pending" />
                    <Link className="btn btn-sm" href={`/admin/pending/${p.slug}`} onClick={(e) => e.stopPropagation()}>
                      <Eye size={13} />Review
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
