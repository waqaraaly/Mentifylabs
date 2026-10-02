import type { ReviewEvent } from "@/types/reviewEvent";
import { REVIEW_EVENT_LABELS } from "@/types/reviewEvent";

const DOT = { ok: "var(--ml-ok)", danger: "var(--ml-danger)", info: "var(--ml-info)" } as const;

export const formatEventTime = (iso: string) => iso.slice(0, 16).replace("T", " ");

/** Newest-first timeline of Super Admin decisions, with the feedback that went with each. */
export function ReviewHistory({ events, empty }: { events: ReviewEvent[]; empty?: string }) {
  if (events.length === 0) {
    return empty ? <div className="subtle" style={{ fontSize: 13, padding: "8px 0" }}>{empty}</div> : null;
  }
  return (
    <div style={{ borderLeft: "1px solid var(--ml-border)", marginLeft: 6, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      {events.map((e) => {
        const meta = REVIEW_EVENT_LABELS[e.kind];
        return (
          <div key={e.id} style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: -22, top: 6, width: 8, height: 8, borderRadius: 50, background: DOT[meta.tone], border: "2px solid var(--ml-bg)" }} />
            <div className="mono" style={{ fontSize: 11.5, color: "var(--ml-ink-subtle)" }}>
              {formatEventTime(e.createdAt)}{e.actorName ? ` · ${e.actorName}` : ""}
            </div>
            <div style={{ fontSize: 13.5, marginTop: 1, fontWeight: 500 }}>{meta.label}</div>
            {e.note && <div style={{ fontSize: 13, marginTop: 2, color: "var(--ml-ink-muted)", lineHeight: 1.5 }}>{e.note}</div>}
          </div>
        );
      })}
    </div>
  );
}
