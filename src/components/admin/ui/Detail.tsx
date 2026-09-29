import type { ReactNode } from "react";

/** Shared building blocks for the Super Admin detail pages (practitioner, profile review, appointment). */

/** One card language for every section of a detail page. */
export function Section({ icon, title, children, span = 1 }: { icon: ReactNode; title: string; children: ReactNode; span?: 1 | 2 }) {
  return (
    <section className="card" style={{ gridColumn: span === 2 ? "1 / -1" : undefined, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid var(--ml-border-soft)" }}>
        <span className="kpi-icon" style={{ width: 28, height: 28, borderRadius: 8 }}>{icon}</span>
        <h3 className="h3" style={{ fontSize: 14 }}>{title}</h3>
      </div>
      <div style={{ padding: "6px 20px 12px" }}>{children}</div>
    </section>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 12, alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--ml-border-soft)", fontSize: 13.5 }}>
      <div style={{ color: "var(--ml-ink-muted)", fontSize: 13 }}>{label}</div>
      <div style={{ minWidth: 0, wordBreak: "break-word" }}>{children}</div>
    </div>
  );
}

export function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "14px 24px" }}>
      <div style={{ fontSize: 12, color: "var(--ml-ink-muted)" }}>{label}</div>
      <div className="tnum" style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{value}</div>
    </div>
  );
}

export const dash = <span className="subtle">—</span>;

export const sectionGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
  gap: 16,
  alignItems: "stretch",
} as const;
