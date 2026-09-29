import { Sparkline } from "./charts";

export function KPI({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6, minHeight: 92 }}>
      <div style={{ fontSize: 12.5, color: "var(--zf-ink-muted)", lineHeight: 1.3 }}>{label}</div>
      <div className="tnum" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{value}</div>
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
    <div className="card" style={{ padding: "14px 16px", minHeight: 132 }}>
      <div style={{ fontSize: 12.5, color: "var(--zf-ink-muted)" }}>{label}</div>
      <div className="tnum" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.05, marginTop: 4 }}>{value}</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10, gap: 8 }}>
        <div style={{ fontSize: 11.5, color: "var(--zf-ink-subtle)" }}>{delta}</div>
        {series && (
          <div style={{ width: 80 }}>
            <Sparkline data={series} color={accent ?? "var(--zf-accent)"} height={28} />
          </div>
        )}
      </div>
    </div>
  );
}
