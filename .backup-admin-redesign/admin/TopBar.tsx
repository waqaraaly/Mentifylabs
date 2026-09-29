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
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "24px 32px 18px", gap: 24 }}>
      <div>
        <div className="h1">{title}</div>
        {subtitle && <div style={{ marginTop: 4, color: "var(--zf-ink-muted)", fontSize: 13.5 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
    </div>
  );
}
