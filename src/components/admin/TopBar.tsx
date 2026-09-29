import type { ReactNode } from "react";

export function TopBar({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "32px 32px 22px", gap: 24, flexWrap: "wrap" }}>
      <div>
        <h1 className="h1">{title}</h1>
        {subtitle && <div style={{ marginTop: 6, color: "var(--ml-ink-muted)", fontSize: 14 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
    </div>
  );
}
