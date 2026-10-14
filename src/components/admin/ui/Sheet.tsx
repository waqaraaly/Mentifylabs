import type { ReactNode } from "react";

/** A band that names a group of rows inside a sheet card. */
export function SheetGroup({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="sheet-group">
      <span style={{ display: "grid", color: "var(--ml-accent)" }}>{icon}</span>
      {title}
    </div>
  );
}

/** A single short fact: label on the left, value on the right. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sheet-row compact">
      <div className="sheet-label">{label}</div>
      <div className="sheet-body">{children}</div>
    </div>
  );
}

/** One thing Super Admin can do: what it is and what it does on the left, the button(s) on the right. */
export function ActionRow({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div className="action-row">
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ml-ink)" }}>{title}</div>
        <div style={{ fontSize: 13.5, color: "var(--ml-ink-muted)", marginTop: 4, lineHeight: 1.55, maxWidth: 560 }}>{text}</div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>{children}</div>
    </div>
  );
}
