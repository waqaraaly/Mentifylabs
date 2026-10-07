export function Sparkline({
  data,
  color = "var(--ml-accent)",
  height = 36,
  fill = true,
}: {
  data: number[];
  color?: string;
  height?: number;
  fill?: boolean;
}) {
  const w = 120;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const step = w / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => [i * step, height - 4 - ((v - min) / range) * (height - 8)]);
  const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = path + ` L ${w},${height} L 0,${height} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ height }}>
      {fill && <path d={area} fill={color} opacity="0.08" />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Rounds the top of a chart axis up to a tidy number, so the gridlines fall on 0, 5, 10, 15 rather than 0, 6, 12, 18. */
function niceMax(value: number, intervals: number): number {
  const rough = Math.max(value, 1) / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)!;
  return step * intervals;
}

/**
 * How the number of practitioners grew, one point per month. A single line: no second series, no legend.
 * The count is written over every point so nobody has to read it off the axis.
 */
export function GrowthChart({ data }: { data: { m: string; joined: number; total: number }[] }) {
  const W = 960, H = 340, pad = { l: 44, r: 24, t: 28, b: 36 };
  const intervals = 4;
  const max = niceMax(Math.max(...data.map((d) => d.total)), intervals);
  const innerW = W - pad.l - pad.r;
  const x = (i: number) => pad.l + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.total)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const ticks = Array.from({ length: intervals + 1 }, (_, i) => (max / intervals) * i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Practitioners by month">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? "var(--ml-border-strong)" : "var(--ml-border)"} />
          <text x={pad.l - 10} y={y(v) + 4} fontSize="12" fill="var(--ml-ink-subtle)" textAnchor="end" fontFamily="var(--ml-mono)">{v}</text>
        </g>
      ))}
      <path d={area} fill="var(--ml-accent)" opacity="0.08" />
      <path d={line} fill="none" stroke="var(--ml-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <title>{`${d.m}: ${d.total} practitioners${d.joined ? `, ${d.joined} joined` : ""}`}</title>
          <circle cx={x(i)} cy={y(d.total)} r="4.5" fill="var(--ml-surface)" stroke="var(--ml-accent)" strokeWidth="2.5" />
          <text x={x(i)} y={y(d.total) - 12} fontSize="12.5" fontWeight="600" fill="var(--ml-ink)" textAnchor="middle" fontFamily="var(--ml-font)">{d.total}</text>
          <text x={x(i)} y={H - 10} fontSize="12.5" fill="var(--ml-ink-muted)" textAnchor="middle" fontFamily="var(--ml-font)">{d.m}</text>
        </g>
      ))}
    </svg>
  );
}

/** A solid pie: one slice per entry, starting at twelve o'clock. Zero-sized slices are skipped. */
export function PieChart({ data, size = 170, label }: { data: { value: number; color: string }[]; size?: number; label: string }) {
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((sum, d) => sum + d.value, 0);
  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  let angle = -Math.PI / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, flexShrink: 0 }} role="img" aria-label={label}>
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="var(--ml-surface-3)" />
      ) : slices.length === 1 ? (
        <circle cx={cx} cy={cy} r={r} fill={slices[0].color} />
      ) : (
        slices.map((d, i) => {
          const start = angle;
          angle += (d.value / total) * Math.PI * 2;
          const large = angle - start > Math.PI ? 1 : 0;
          const x0 = cx + r * Math.cos(start), y0 = cy + r * Math.sin(start);
          const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
          return <path key={i} d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`} fill={d.color} stroke="var(--ml-surface)" strokeWidth="2" />;
        })
      )}
    </svg>
  );
}
