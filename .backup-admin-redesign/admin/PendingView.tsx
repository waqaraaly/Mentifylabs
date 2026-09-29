"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { PractitionerDocument } from "@/types/document";
import { Avatar } from "./ui/Avatar";
import { EmptyState } from "./ui/Overlays";
import { ProfileReviewDrawer } from "./ProfileReviewDrawer";
import { TopBar } from "./TopBar";

export function PendingView({
  queue,
  documents,
  siteUrl,
}: {
  queue: Practitioner[];
  documents: PractitionerDocument[];
  siteUrl: string;
}) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const selected = queue.find((p) => p.slug === selectedSlug) ?? null;

  return (
    <div>
      <TopBar title="Pending profile review" subtitle="Public profiles awaiting moderation" />

      <div style={{ padding: "0 32px 32px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--zf-border)" }}>
            <div className="h2">Review queue</div>
            <div style={{ fontSize: 12, color: "var(--zf-ink-subtle)", marginTop: 2 }}>{queue.length} profiles awaiting action</div>
          </div>
          {queue.length === 0 ? (
            <EmptyState title="All caught up" body="Nothing else in the review queue right now." />
          ) : (
            <div>
              {queue.map((p, i) => (
                <div
                  key={p.slug}
                  onClick={() => setSelectedSlug(p.slug)}
                  style={{
                    padding: "12px 16px", cursor: "pointer",
                    borderBottom: i === queue.length - 1 ? "none" : "1px solid var(--zf-border-soft)",
                    background: selectedSlug === p.slug ? "var(--zf-accent-tint)" : "transparent",
                    display: "flex", gap: 12, alignItems: "center",
                  }}
                >
                  <Avatar name={p.fullName} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }} className="truncate">{p.fullName}</div>
                    <div className="truncate" style={{ fontSize: 12, color: "var(--zf-ink-muted)", marginTop: 1 }}>{p.professionalTitle}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: "var(--zf-ink-subtle)" }}>Submitted {p.dateJoined}</span>
                  <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedSlug(p.slug); }}>
                    <Eye size={13} />Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProfileReviewDrawer
        practitioner={selected}
        documents={selected ? documents.filter((d) => d.practitionerSlug === selected.slug) : []}
        siteUrl={siteUrl}
        onClose={() => setSelectedSlug(null)}
      />
    </div>
  );
}
