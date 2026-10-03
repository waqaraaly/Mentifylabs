import type { ReactNode } from "react";
import {
  Globe, Layers, Link2, Mail, MessageCircle, Search, Send, type LucideIcon,
} from "lucide-react";
import type { BreakdownRow } from "@/data/profileStats";
import { PLATFORM_ICON_PATH } from "@/components/practitioner/ContactLinks";

/**
 * The two "who are my visitors" pictures on the Profile stats page, shared by the practitioner's own page and
 * the Super Admin's per-practitioner page so both show exactly the same thing: a ranked list (sources) and a
 * headline plus a short list (countries). They render only the content, so the page wraps them in a card.
 */

const fmt = (n: number) => n.toLocaleString("en-US");
const share = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="px-6 py-8 text-sm text-muted">{children}</p>;
}

// ---- Where visitors come from: a ranked list with the platform's icon ----

const BRAND_GLYPH: Record<string, keyof typeof PLATFORM_ICON_PATH> = {
  Instagram: "instagram",
  Facebook: "facebook",
  LinkedIn: "linkedin",
  "X / Twitter": "twitter",
  YouTube: "youtube",
};

const SOURCE_ICON: Record<string, LucideIcon> = {
  Direct: Link2,
  Search: Search,
  WhatsApp: MessageCircle,
  Telegram: Send,
  Email: Mail,
};

function SourceIcon({ label }: { label: string }) {
  const glyph = BRAND_GLYPH[label];
  const Icon = SOURCE_ICON[label] ?? Globe;
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.1] text-primary">
      {glyph ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
          <path d={PLATFORM_ICON_PATH[glyph]} />
        </svg>
      ) : (
        <Icon className="size-4" aria-hidden />
      )}
    </span>
  );
}

const MAX_SOURCES = 5;

/** Ranking is the question here, so these stay bars: the top five, with everything smaller folded into one row. */
export function SourcesList({ rows, total }: { rows: BreakdownRow[]; total: number }) {
  if (rows.length === 0) return <Empty>No data yet.</Empty>;
  const top = rows.slice(0, MAX_SOURCES);
  const rest = rows.slice(MAX_SOURCES);
  const shown: BreakdownRow[] = rest.length
    ? [...top, { label: `${rest.length} other ${rest.length === 1 ? "source" : "sources"}`, count: rest.reduce((s, r) => s + r.count, 0) }]
    : top;
  const max = Math.max(...shown.map((r) => r.count), 1);

  return (
    <ul className="space-y-4 px-6 py-5">
      {shown.map((row, i) => (
        <li key={row.label} className="flex items-center gap-3">
          {i < top.length ? (
            <SourceIcon label={row.label} />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.1] text-primary">
              <Layers className="size-4" aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className={`truncate ${i < top.length ? "" : "text-muted"}`}>{row.label}</span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold">{fmt(row.count)}</span>
                <span className="ml-1.5 text-xs text-muted">{share(row.count, total)}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-primary/[0.1]">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(3, (row.count / max) * 100)}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---- Top countries: a headline, then the runners-up as plain text ----

const MAX_COUNTRIES = 4;

export function CountrySummary({ rows, total }: { rows: BreakdownRow[]; total: number }) {
  if (rows.length === 0) return <Empty>Location isn&apos;t available for these visits.</Empty>;
  const [lead, ...others] = rows;
  const shown = others.slice(0, MAX_COUNTRIES);
  const more = others.length - shown.length;

  return (
    <div className="px-6 py-5">
      <p className="text-xs font-medium tracking-[0.06em] text-muted uppercase">Most visitors from</p>
      <div className="mt-1.5 flex items-end justify-between gap-4">
        <p className="min-w-0 truncate text-2xl font-semibold tracking-tight">{countryName(lead.label)}</p>
        <p className="shrink-0 text-right">
          <span className="text-4xl leading-none font-bold tracking-tight tabular-nums">{share(lead.count, total)}%</span>
        </p>
      </div>
      <p className="mt-1 text-sm text-muted tabular-nums">{fmt(lead.count)} {lead.count === 1 ? "view" : "views"}</p>

      {shown.length > 0 && (
        <ul className="mt-5 divide-y divide-black/[0.06] border-t border-black/[0.06]">
          {shown.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="truncate">{countryName(row.label)}</span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold">{share(row.count, total)}%</span>
                <span className="ml-2 text-xs text-muted">{fmt(row.count)}</span>
              </span>
            </li>
          ))}
          {more > 0 && <li className="py-2.5 text-xs text-muted">+ {more} more {more === 1 ? "country" : "countries"}</li>}
        </ul>
      )}
    </div>
  );
}
