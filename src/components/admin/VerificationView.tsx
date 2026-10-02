"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { EmptyState } from "./ui/Overlays";
import { TopBar } from "./TopBar";
import { daysSinceSubmitted } from "@/lib/verification";

export function VerificationView({ queue }: { queue: Practitioner[] }) {
  const router = useRouter();

  return (
    <div>
      <TopBar title="Verification requests" subtitle="Degree, license and ID documents awaiting review" />

      <div style={{ padding: "0 32px 32px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ml-border)" }}>
            <div className="h2">Review queue</div>
            <div style={{ fontSize: 12, color: "var(--ml-ink-subtle)", marginTop: 2 }}>{queue.length} requests pending</div>
          </div>
          {queue.length === 0 ? (
            <EmptyState title="All caught up" body="No verification requests waiting right now." />
          ) : (
            <div>
              {queue.map((p, i) => {
                const waitingDays = daysSinceSubmitted(p.verificationSubmittedAt);
                return (
                  <div
                    key={p.slug}
                    onClick={() => router.push(`/admin/verification/${p.slug}`)}
                    className="list-row"
                    style={{ cursor: "pointer", borderBottom: i === queue.length - 1 ? "none" : undefined }}
                  >
                    <Avatar name={p.fullName} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }} className="truncate">{p.fullName}</div>
                      <div className="truncate" style={{ fontSize: 12, color: "var(--ml-ink-muted)", marginTop: 2 }}>{p.professionalTitle}</div>
                    </div>
                    <Badge kind={p.verificationStatus} />
                    <span className="tnum hide-sm" style={{ fontSize: 12, color: "var(--ml-ink-subtle)" }}>
                      {waitingDays === null ? "—" : waitingDays === 0 ? "Today" : `Waiting ${waitingDays}d`}
                    </span>
                    <Link className="btn btn-sm" href={`/admin/verification/${p.slug}`} onClick={(e) => e.stopPropagation()}>
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
