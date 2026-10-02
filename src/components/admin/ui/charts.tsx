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

export function GrowthChart({ data }: { data: { m: string; new: number; active: number }[] }) {
  const W = 640, H = 200, pad = { l: 28, r: 12, t: 8, b: 22 };
  const maxA = Math.max(...data.map((d) => d.active));
  const maxN = Math.max(...data.map((d) => d.new));
  const max = Math.max(maxA, maxN * 4, 1);
  const stepX = (W - pad.l - pad.r) / Math.max(1, data.length - 1);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);

  const activeLine = data.map((d, i) => (i === 0 ? "M" : "L") + (pad.l + i * stepX) + "," + y(d.active)).join(" ");

  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => Math.round((max / ticks) * i));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 200 }}>
      {tickVals.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--ml-border)" strokeDasharray={i === 0 ? "0" : "2 3"} />
          <text x={pad.l - 6} y={y(v) + 3} fontSize="10" fill="var(--ml-ink-subtle)" textAnchor="end" fontFamily="var(--ml-mono)">{v}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = pad.l + i * stepX - 10;
        const h = (H - pad.t - pad.b) * (d.new / max);
        return <rect key={i} x={x} y={H - pad.b - h} width="20" height={h} fill="var(--ml-accent)" opacity="0.85" rx="2" />;
      })}
      <path d={activeLine} fill="none" stroke="var(--ml-ink-faint)" strokeWidth="1.5" strokeDasharray="4 3" />
      {data.map((d, i) => (
        <circle key={i} cx={pad.l + i * stepX} cy={y(d.active)} r="3" fill="var(--ml-bg)" stroke="var(--ml-ink-faint)" strokeWidth="1.5" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={pad.l + i * stepX} y={H - 6} fontSize="10.5" fill="var(--ml-ink-subtle)" textAnchor="middle" fontFamily="var(--ml-font)">{d.m}</text>
      ))}
    </svg>
  );
}

export function DonutChart({ data, size = 130 }: { data: { value: number; color: string }[]; size?: number }) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const r = size / 2 - 12;
  const cx = size / 2, cy = size / 2;
  const cumulative = data.reduce<number[]>((sums, d, i) => {
    sums.push((sums[i - 1] ?? 0) + d.value);
    return sums;
  }, []);
  const arcs = data.map((d, i) => {
    const startValue = i === 0 ? 0 : cumulative[i - 1];
    const a0 = (startValue / total) * Math.PI * 2 - Math.PI / 2;
    const a1 = (cumulative[i] / total) * Math.PI * 2 - Math.PI / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return <path key={i} d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`} fill={d.color} />;
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {arcs}
      <circle cx={cx} cy={cy} r={r * 0.62} fill="var(--ml-surface)" />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="20" fontWeight="600" fill="var(--ml-ink)" fontFamily="var(--ml-mono)" style={{ letterSpacing: "-0.02em" }}>{total}</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="9.5" fill="var(--ml-ink-subtle)" fontFamily="var(--ml-font)" style={{ letterSpacing: "0.04em" }}>TOTAL</text>
    </svg>
  );
}
