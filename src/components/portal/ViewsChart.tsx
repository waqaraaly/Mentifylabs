"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import type { DailyPoint } from "@/data/profileStats";

const DEFAULT_WIDTH = 720;
const PAD = { left: 34, right: 16, top: 30, bottom: 30 };
/** Keeps the first and last point clear of the plot edge, so they are never clipped. */
const INSET = 8;

const dayLabel = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Top of the axis, chosen so its gridline steps are clean numbers. */
function niceMax(value: number): number {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value / 4));
  for (const step of [1, 2, 3, 4, 5, 6, 8, 10]) if (4 * step * magnitude >= value) return 4 * step * magnitude;
  return 40 * magnitude;
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/**
 * A smooth curve through the points that never overshoots (monotone cubic), so a quiet day stays on the
 * baseline instead of dipping below it and a spike stays at its true height.
 */
function curve(points: [number, number][]): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${points[0][0]},${points[0][1]}`;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1][0] - points[i][0];
    slope[i] = (points[i + 1][1] - points[i][1]) / dx[i];
  }
  const t: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) t[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  t[n - 1] = slope[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / slope[i];
    const b = t[i + 1] / slope[i];
    const h = a * a + b * b;
    if (h > 9) {
      const tau = 3 / Math.sqrt(h);
      t[i] = tau * a * slope[i];
      t[i + 1] = tau * b * slope[i];
    }
  }
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const w = dx[i] / 3;
    d += ` C${(x0 + w).toFixed(1)},${(y0 + t[i] * w).toFixed(1)} ${(x1 - w).toFixed(1)},${(y1 - t[i + 1] * w).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}

/**
 * Daily profile views as a smooth area chart. A crosshair snaps to the nearest day and one card reads it
 * out; the busiest day is labelled and today is marked as still counting. A table view carries the same
 * numbers for screen readers.
 */
export function ViewsChart({ data }: { data: DailyPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const gradient = useId().replace(/:/g, "");

  // Drawn at the real on-screen width so text stays a readable size on a phone.
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(260, Math.round(el.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // On a touch screen the reading stays after the finger lifts; tapping anywhere else dismisses it.
  useEffect(() => {
    if (active === null) return;
    const dismiss = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [active]);

  const n = data.length;
  const narrow = width < 480;
  const height = narrow ? 230 : 290;

  const total = data.reduce((sum, d) => sum + d.views, 0);
  const average = n ? total / n : 0;
  let peakIndex = 0;
  data.forEach((d, i) => {
    if (d.views > data[peakIndex].views) peakIndex = i;
  });
  const peak = data[peakIndex];

  const top = niceMax(Math.max(...data.map((d) => d.views), 0));
  const plotH = height - PAD.top - PAD.bottom;
  const x0 = PAD.left + INSET;
  const span = width - PAD.right - INSET - x0;
  const step = n > 1 ? span / (n - 1) : 0;
  const x = (i: number) => (n > 1 ? x0 + step * i : PAD.left + (width - PAD.left - PAD.right) / 2);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const baseline = y(0);
  const ticks = [0, top / 2, top];
  const labelEvery = Math.max(1, Math.ceil(n / (narrow ? 4 : 6)));
  const everyDot = n <= 14;

  const points = data.map((d, i): [number, number] => [x(i), y(d.views)]);
  const line = curve(points);
  const area = `${line} L${x(n - 1).toFixed(1)},${baseline} L${x(0).toFixed(1)},${baseline} Z`;

  const point = active === null ? null : data[active];
  const tipX = active === null ? 0 : x(active);
  const tipOnRight = tipX < width / 2;
  const isToday = (i: number) => i === n - 1;

  /** The pointer finds a date, not a pixel: snap to the nearest day anywhere in the plot. */
  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * width;
    setActive(n > 1 ? Math.min(n - 1, Math.max(0, Math.round((px - x0) / step))) : 0);
  };

  return (
    <div>
      {/* One line of context above the chart, so the shape has numbers to go with it. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
          <span className="text-muted">
            Average <span className="font-semibold text-foreground tabular-nums">{average < 10 ? average.toFixed(1) : Math.round(average)}</span> a day
          </span>
          {peak.views > 0 && (
            <span className="text-muted">
              Best day <span className="font-semibold text-foreground">{dayLabel(peak.day)}</span>
              <span className="tabular-nums"> · {plural(peak.views, "view", "views")}</span>
            </span>
          )}
        </div>
      </div>

      <div className="relative" ref={box}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full touch-pan-y select-none"
          role="img"
          aria-label={`Area chart of daily profile views, last ${n} days`}
          // A mouse leaving clears the readout; a finger lifting must not, or a tap would vanish at once.
          onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} opacity={t === 0 ? 1 : 0.7} />
              <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted)" opacity={0.85}>
                {Math.round(t).toLocaleString("en-US")}
              </text>
            </g>
          ))}

          {data.map((d, i) =>
            // A date label too close to "Today" would collide with it, so it is dropped.
            (i % labelEvery === 0 && n - 1 - i >= Math.ceil(labelEvery * 0.7)) || i === n - 1 ? (
              <text
                key={d.day}
                x={x(i)}
                y={height - 8}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                dx={i === 0 ? -INSET : i === n - 1 ? INSET : 0}
                fontSize={11}
                fill="var(--muted)"
                opacity={0.85}
              >
                {i === n - 1 ? "Today" : dayLabel(d.day)}
              </text>
            ) : null,
          )}

          <path d={area} fill={`url(#${gradient})`} />
          <path d={line} fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* A dot on every day for short ranges; otherwise the busiest day and today, so a long line stays clean. */}
          {data.map((d, i) =>
            everyDot || i === n - 1 ? (
              <circle
                key={d.day}
                cx={x(i)}
                cy={y(d.views)}
                r={isToday(i) ? 4.5 : 4}
                // Today's count is still growing, so it is drawn hollow.
                fill={isToday(i) ? "var(--surface)" : "var(--primary)"}
                stroke={isToday(i) ? "var(--primary)" : "var(--surface)"}
                strokeWidth={2}
              />
            ) : null,
          )}

          {/* The busiest day, labelled where it happens. */}
          {active === null && peak.views > 0 && n > 7 && (
            <g pointerEvents="none">
              {!everyDot && peakIndex !== n - 1 && (
                <circle cx={x(peakIndex)} cy={y(peak.views)} r={4} fill="var(--primary)" stroke="var(--surface)" strokeWidth={2} />
              )}
              <text
                x={Math.min(width - PAD.right - 8, Math.max(PAD.left + 8, x(peakIndex)))}
                y={y(peak.views) - 11}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill="var(--foreground)"
                stroke="var(--surface)"
                strokeWidth={4}
                paintOrder="stroke"
              >
                {peak.views}
              </text>
            </g>
          )}

          {active !== null && point && (
            <g pointerEvents="none">
              <line x1={x(active)} x2={x(active)} y1={PAD.top - 6} y2={baseline} stroke="var(--primary)" strokeOpacity={0.35} strokeWidth={1} />
              <circle cx={x(active)} cy={y(point.views)} r={11} fill="var(--primary)" opacity={0.16} />
              <circle cx={x(active)} cy={y(point.views)} r={5} fill="var(--primary)" stroke="var(--surface)" strokeWidth={2} />
            </g>
          )}

          {/* One hit area over the whole plot; the crosshair does the aiming. */}
          <rect
            x={PAD.left}
            y={PAD.top - 6}
            width={width - PAD.left - PAD.right}
            height={plotH + 6}
            fill="transparent"
            onPointerEnter={onMove}
            onPointerMove={onMove}
            onPointerDown={onMove}
          />
        </svg>

        {point && (
          <div
            className="pointer-events-none absolute z-10 rounded-xl bg-surface px-3.5 py-2.5 text-xs whitespace-nowrap text-foreground shadow-lg ring-1 ring-black/[0.08]"
            style={{ top: PAD.top, ...(tipOnRight ? { left: tipX + 16 } : { right: width - tipX + 16 }) }}
          >
            <div className="text-muted">
              {dayLabel(point.day)}
              {isToday(active!) && " · so far today"}
            </div>
            <div className="mt-1 text-base leading-tight font-semibold tabular-nums">{plural(point.views, "view", "views")}</div>
            <div className="mt-0.5 text-muted tabular-nums">{plural(point.visitors, "visitor", "visitors")}</div>
          </div>
        )}
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted transition hover:text-foreground">View as table</summary>
        <div className="themed-scrollbar mt-3 max-h-64 overflow-auto rounded-lg ring-1 ring-black/[0.07]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Day</th>
                <th className="px-4 py-2 text-right font-medium">Views</th>
                <th className="px-4 py-2 text-right font-medium">Visitors</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.day} className="border-t border-black/[0.06]">
                  <td className="px-4 py-2">{dayLabel(d.day)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{d.views}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{d.visitors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
