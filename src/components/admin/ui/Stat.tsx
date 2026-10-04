import type { ReactNode } from "react";
import { Sparkline } from "./charts";

export function KPI({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
}) {
  return (
    <div className="card kpi">
      <div className="stat-label">{label}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div className="tnum kpi-value">{value}</div>
        {icon && <div className="kpi-icon">{icon}</div>}
      </div>
    </div>
  );
}

export function BigStat({
  label,
  value,
  delta,
  series,
  accent,
}: {
  label: string;
  value: string | number;
  delta?: string;
  series?: number[];
  accent?: string;
}) {
  return (
    <div className="card" style={{ padding: 20, minHeight: 132 }}>
      <div className="stat-label">{label}</div>
      <div className="tnum" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.05, marginTop: 12 }}>{value}</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10, gap: 8 }}>
        <div style={{ fontSize: 11.5, color: "var(--ml-ink-subtle)" }}>{delta}</div>
        {series && (
          <div style={{ width: 80 }}>
            <Sparkline data={series} color={accent ?? "var(--ml-accent)"} height={28} />
          </div>
        )}
      </div>
    </div>
  );
}
