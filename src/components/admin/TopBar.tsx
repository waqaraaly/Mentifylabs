import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** The admin page header — the same shape as the practitioner portal's PageHeader: icon, title, one line of context, actions, closed off by a hairline. */
export function TopBar({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div style={{ padding: "32px var(--ml-gutter) 24px" }}>
      <header
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap",
          columnGap: 24, rowGap: 16, paddingBottom: 24, borderBottom: "1px solid rgba(0, 0, 0, 0.07)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1 className="h1" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 12, rowGap: 4 }}>
            {Icon && <Icon size={24} style={{ flexShrink: 0, color: "var(--ml-accent)" }} aria-hidden />}
            {title}
          </h1>
          {subtitle && <p style={{ margin: "6px 0 0", color: "var(--ml-ink-muted)", fontSize: 15, lineHeight: 1.6 }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>{actions}</div>}
      </header>
    </div>
  );
}
