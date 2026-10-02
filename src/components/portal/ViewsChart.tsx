"use client";

import { useState } from "react";
import type { DailyPoint } from "@/data/profileStats";

const WIDTH = 720;
const HEIGHT = 260;
const PAD = { left: 40, right: 8, top: 12, bottom: 28 };
const MAX_BAR = 24;
const GAP = 2;

const dayLabel = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Top of the axis, chosen so its four gridline steps are clean numbers (1, 2, 3, 4, 5, 6, 8 × 10ⁿ). */
function niceMax(value: number): number {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value / 4));
  for (const step of [1, 2, 3, 4, 5, 6, 8, 10]) if (4 * step * magnitude >= value) return 4 * step * magnitude;
  return 40 * magnitude;
}

/** Bar with only its top corners rounded, so it sits flat on the baseline. */
function barPath(x: number, y: number, w: number, h: number, r: number): string {
  const radius = Math.min(r, w / 2, h);
  return `M${x},${y + h} V${y + radius} Q${x},${y} ${x + radius},${y} H${x + w - radius} Q${x + w},${y} ${x + w},${y + radius} V${y + h} Z`;
}

/** Daily profile views as columns, with a hover readout and a table view for screen readers. */
export function ViewsChart({ data }: { data: DailyPoint[] }) {
  const [active, setActive] = useState<number | null>(null);

  const top = niceMax(Math.max(...data.map((d) => d.views), 0));
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.max(2, Math.min(MAX_BAR, slot - GAP));
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const labelEvery = Math.ceil(data.length / 6);
  const ticks = [0, 1, 2, 3, 4].map((i) => (top / 4) * i);

  const point = active === null ? null : data[active];
  const tipLeft = active === null ? 0 : ((PAD.left + slot * (active + 0.5)) / WIDTH) * 100;

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Daily profile views, last ${data.length} days`}
          onPointerLeave={() => setActive(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">
                {Math.round(t).toLocaleString("en-US")}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const h = (d.views / top) * plotH;
            const x = PAD.left + slot * i + (slot - barW) / 2;
            return (
              <g key={d.day}>
                {d.views > 0 && (
                  <path
                    d={barPath(x, y(d.views), barW, Math.max(h, 2), 4)}
                    fill={active === i ? "var(--hero)" : "var(--primary)"}
                  />
                )}
                {i % labelEvery === 0 && (
                  <text x={PAD.left + slot * (i + 0.5)} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
                    {dayLabel(d.day)}
                  </text>
                )}
                {/* Full-height hit area, so the reader aims at a date rather than a thin bar. */}
                <rect
                  x={PAD.left + slot * i}
                  y={PAD.top}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                  onPointerEnter={() => setActive(i)}
                  onPointerMove={() => setActive(i)}
                />
              </g>
            );
          })}
        </svg>

        {point && (
          <div
            className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-xs text-background shadow-lg"
            style={{ left: `clamp(60px, ${tipLeft}%, calc(100% - 60px))` }}
          >
            <div className="text-background/70">{dayLabel(point.day)}</div>
            <div className="mt-0.5 text-sm font-semibold tabular-nums">
              {point.views.toLocaleString("en-US")} {point.views === 1 ? "view" : "views"}
            </div>
            <div className="text-background/70 tabular-nums">
              {point.visitors.toLocaleString("en-US")} {point.visitors === 1 ? "visitor" : "visitors"}
            </div>
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
