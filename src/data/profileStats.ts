import { all, first, run } from "@/lib/db";
import { randomToken, sha256Hex } from "@/lib/session";
import type { DeviceKind } from "@/lib/trafficSource";
import { STATS_RANGES, type StatsRange } from "@/lib/statsRanges";

const DAY_MS = 24 * 60 * 60 * 1000;
/** The same visitor reloading or revisiting inside this window is one view, not many. */
const REPEAT_WINDOW_MINUTES = 30;

export { STATS_RANGES, type StatsRange };

const utcDay = (date: Date) => date.toISOString().slice(0, 10);

/** Today's random salt, created on first use. Older salts are deleted so old visitor hashes can't be linked. */
async function todaysSalt(day: string): Promise<string> {
  await run("INSERT OR IGNORE INTO analytics_salts (day, salt) VALUES (?, ?)", day, randomToken());
  await run("DELETE FROM analytics_salts WHERE day < ?", day);
  const row = await first<{ salt: string }>("SELECT salt FROM analytics_salts WHERE day = ?", day);
  return row?.salt ?? day;
}

export async function profileExists(slug: string): Promise<boolean> {
  return !!(await first("SELECT 1 FROM practitioners WHERE slug = ? AND status = 'active'", slug));
}

/**
 * Counts one visit to a public profile. The visitor is stored only as a hash of IP + browser + today's
 * random salt, never the IP or user agent themselves. Returns false when it was a repeat visit.
 */
export async function recordProfileView(input: {
  slug: string;
  ip: string;
  userAgent: string;
  source: string;
  country: string | null;
  device: DeviceKind;
}): Promise<boolean> {
  const now = new Date();
  const day = utcDay(now);
  const visitor = (await sha256Hex(`${await todaysSalt(day)}|${input.slug}|${input.ip}|${input.userAgent}`)).slice(0, 24);

  const repeat = await first(
    `SELECT 1 FROM profile_views WHERE practitioner_slug = ? AND visitor = ?
        AND at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
    input.slug,
    visitor,
    `-${REPEAT_WINDOW_MINUTES} minutes`,
  );
  if (repeat) return false;

  await run(
    "INSERT INTO profile_views (practitioner_slug, day, visitor, source, country, device) VALUES (?, ?, ?, ?, ?, ?)",
    input.slug,
    day,
    visitor,
    input.source,
    input.country,
    input.device,
  );
  return true;
}

export interface DailyPoint {
  day: string;
  views: number;
  visitors: number;
}

export interface BreakdownRow {
  label: string;
  count: number;
}

export interface ProfileStats {
  range: StatsRange;
  daily: DailyPoint[];
  views: number;
  /** Distinct visitors per day, added up — someone returning on another day counts again. */
  visitors: number;
  previousViews: number;
  previousVisitors: number;
  sources: BreakdownRow[];
  countries: BreakdownRow[];
  devices: BreakdownRow[];
  bookingRequests: number;
  confirmedBookings: number;
}

interface PeriodTotals {
  views: number;
  visitors: number;
}

async function periodTotals(slug: string, from: string, to: string): Promise<PeriodTotals> {
  const row = await first<{ views: number; visitors: number }>(
    `SELECT count(*) AS views,
            (SELECT count(*) FROM (SELECT DISTINCT day, visitor FROM profile_views
              WHERE practitioner_slug = ?1 AND day BETWEEN ?2 AND ?3)) AS visitors
       FROM profile_views WHERE practitioner_slug = ?1 AND day BETWEEN ?2 AND ?3`,
    slug,
    from,
    to,
  );
  return { views: row?.views ?? 0, visitors: row?.visitors ?? 0 };
}

async function breakdown(slug: string, column: "source" | "country" | "device", from: string, to: string, limit: number) {
  return all<BreakdownRow>(
    `SELECT ${column} AS label, count(*) AS count FROM profile_views
      WHERE practitioner_slug = ? AND day BETWEEN ? AND ? AND ${column} IS NOT NULL
      GROUP BY ${column} ORDER BY count DESC, label LIMIT ?`,
    slug,
    from,
    to,
    limit,
  );
}

/** Everything the Stats page shows, for the last `range` days (UTC, today included) and the period before it. */
export async function getProfileStats(slug: string, range: StatsRange): Promise<ProfileStats> {
  const today = new Date();
  const to = utcDay(today);
  const from = utcDay(new Date(today.getTime() - (range - 1) * DAY_MS));
  const previousTo = utcDay(new Date(today.getTime() - range * DAY_MS));
  const previousFrom = utcDay(new Date(today.getTime() - (2 * range - 1) * DAY_MS));

  const [dailyRows, current, previous, sources, countries, devices, bookings] = await Promise.all([
    all<DailyPoint>(
      `SELECT day, count(*) AS views, count(DISTINCT visitor) AS visitors FROM profile_views
        WHERE practitioner_slug = ? AND day BETWEEN ? AND ? GROUP BY day`,
      slug,
      from,
      to,
    ),
    periodTotals(slug, from, to),
    periodTotals(slug, previousFrom, previousTo),
    breakdown(slug, "source", from, to, 8),
    breakdown(slug, "country", from, to, 6),
    breakdown(slug, "device", from, to, 3),
    first<{ requests: number; confirmed: number }>(
      `SELECT count(*) AS requests,
              coalesce(sum(status IN ('confirmed', 'completed')), 0) AS confirmed
         FROM appointments WHERE practitioner_slug = ? AND substr(created_at, 1, 10) BETWEEN ? AND ?`,
      slug,
      from,
      to,
    ),
  ]);

  // Every day in the range gets a point, so quiet days show as zero instead of disappearing.
  const byDay = new Map(dailyRows.map((r) => [r.day, r]));
  const daily: DailyPoint[] = Array.from({ length: range }, (_, i) => {
    const day = utcDay(new Date(today.getTime() - (range - 1 - i) * DAY_MS));
    return byDay.get(day) ?? { day, views: 0, visitors: 0 };
  });

  return {
    range,
    daily,
    views: current.views,
    visitors: current.visitors,
    previousViews: previous.views,
    previousVisitors: previous.visitors,
    sources,
    countries,
    devices,
    bookingRequests: bookings?.requests ?? 0,
    confirmedBookings: bookings?.confirmed ?? 0,
  };
}

// ---- Super Admin: every practitioner at a glance ----

export interface PractitionerStatsRow {
  slug: string;
  views: number;
  visitors: number;
  previousViews: number;
  bookingRequests: number;
  confirmedBookings: number;
  /** The source that sent the most views in this period, if any. */
  topSource: string | null;
}

export interface PlatformStats {
  range: StatsRange;
  daily: DailyPoint[];
  views: number;
  visitors: number;
  previousViews: number;
  previousVisitors: number;
  bookingRequests: number;
  confirmedBookings: number;
  sources: BreakdownRow[];
  /** Only practitioners with any views or booking requests in the period; the page fills in the rest with zeros. */
  rows: PractitionerStatsRow[];
}

/** Profile stats for the whole platform and per practitioner, for the last `range` days (UTC) and the period before. */
export async function getPlatformStats(range: StatsRange): Promise<PlatformStats> {
  const today = new Date();
  const to = utcDay(today);
  const from = utcDay(new Date(today.getTime() - (range - 1) * DAY_MS));
  const previousTo = utcDay(new Date(today.getTime() - range * DAY_MS));
  const previousFrom = utcDay(new Date(today.getTime() - (2 * range - 1) * DAY_MS));

  const [current, previous, previousVisitors, bookings, sourceRows, dailyRows] = await Promise.all([
    all<{ slug: string; views: number; visitors: number }>(
      `SELECT practitioner_slug AS slug, count(*) AS views, count(DISTINCT day || ':' || visitor) AS visitors
         FROM profile_views WHERE day BETWEEN ? AND ? GROUP BY practitioner_slug`,
      from,
      to,
    ),
    all<{ slug: string; views: number }>(
      `SELECT practitioner_slug AS slug, count(*) AS views
         FROM profile_views WHERE day BETWEEN ? AND ? GROUP BY practitioner_slug`,
      previousFrom,
      previousTo,
    ),
    first<{ n: number }>(
      `SELECT count(*) AS n FROM (SELECT DISTINCT practitioner_slug, day, visitor FROM profile_views
        WHERE day BETWEEN ? AND ?)`,
      previousFrom,
      previousTo,
    ),
    all<{ slug: string; requests: number; confirmed: number }>(
      `SELECT practitioner_slug AS slug, count(*) AS requests,
              coalesce(sum(status IN ('confirmed', 'completed')), 0) AS confirmed
         FROM appointments WHERE substr(created_at, 1, 10) BETWEEN ? AND ? GROUP BY practitioner_slug`,
      from,
      to,
    ),
    all<{ slug: string; label: string; count: number }>(
      `SELECT practitioner_slug AS slug, source AS label, count(*) AS count
         FROM profile_views WHERE day BETWEEN ? AND ? GROUP BY practitioner_slug, source`,
      from,
      to,
    ),
    all<DailyPoint>(
      `SELECT day, count(*) AS views, count(DISTINCT practitioner_slug || ':' || visitor) AS visitors
         FROM profile_views WHERE day BETWEEN ? AND ? GROUP BY day`,
      from,
      to,
    ),
  ]);

  const rows = new Map<string, PractitionerStatsRow>();
  const row = (slug: string): PractitionerStatsRow => {
    let r = rows.get(slug);
    if (!r) {
      r = { slug, views: 0, visitors: 0, previousViews: 0, bookingRequests: 0, confirmedBookings: 0, topSource: null };
      rows.set(slug, r);
    }
    return r;
  };
  for (const c of current) Object.assign(row(c.slug), { views: c.views, visitors: c.visitors });
  for (const p of previous) row(p.slug).previousViews = p.views;
  for (const b of bookings) Object.assign(row(b.slug), { bookingRequests: b.requests, confirmedBookings: b.confirmed });

  const best = new Map<string, number>();
  const totalsBySource = new Map<string, number>();
  for (const s of sourceRows) {
    totalsBySource.set(s.label, (totalsBySource.get(s.label) ?? 0) + s.count);
    if (s.count > (best.get(s.slug) ?? 0)) {
      best.set(s.slug, s.count);
      row(s.slug).topSource = s.label;
    }
  }

  const byDay = new Map(dailyRows.map((r) => [r.day, r]));
  const daily: DailyPoint[] = Array.from({ length: range }, (_, i) => {
    const day = utcDay(new Date(today.getTime() - (range - 1 - i) * DAY_MS));
    return byDay.get(day) ?? { day, views: 0, visitors: 0 };
  });

  const list = [...rows.values()];
  return {
    range,
    daily,
    views: list.reduce((n, r) => n + r.views, 0),
    visitors: list.reduce((n, r) => n + r.visitors, 0),
    previousViews: previous.reduce((n, r) => n + r.views, 0),
    previousVisitors: previousVisitors?.n ?? 0,
    bookingRequests: list.reduce((n, r) => n + r.bookingRequests, 0),
    confirmedBookings: list.reduce((n, r) => n + r.confirmedBookings, 0),
    sources: [...totalsBySource.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 6),
    rows: list,
  };
}
