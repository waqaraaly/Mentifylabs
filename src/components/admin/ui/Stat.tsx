import type { ReactNode } from "react";

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
