import type { SlotSessionType } from "@/lib/sessionType";
import type { WeeklyRule, TimeOff, DayOverride } from "@/types/availability";
import { addSlots, setSlotsStatus } from "./slots";
import { addDays } from "@/lib/format";
import { todayIn, zoneOrDefault } from "@/lib/time";
import { all, first, run } from "@/lib/db";

const WEEKS_AHEAD = 8;

interface RuleRow {
  id: string;
  practitioner_slug: string;
  weekday: number;
  start_time: string;
  end_time: string;
  session_type: SlotSessionType;
}
interface TimeOffRow {
  id: string;
  practitioner_slug: string;
  start_date: string;
  end_date: string;
  label: string;
}
interface OverrideRow {
  id: string;
  practitioner_slug: string;
  date: string;
  type: DayOverride["type"];
}

const toRule = (r: RuleRow): WeeklyRule => ({
  id: r.id,
  practitionerSlug: r.practitioner_slug,
  weekday: r.weekday,
  startTime: r.start_time,
  endTime: r.end_time,
  sessionType: r.session_type,
});
const toTimeOff = (r: TimeOffRow): TimeOff => ({
  id: r.id,
  practitionerSlug: r.practitioner_slug,
  startDate: r.start_date,
  endDate: r.end_date,
  label: r.label,
});
const toOverride = (r: OverrideRow): DayOverride => ({
  id: r.id,
  practitionerSlug: r.practitioner_slug,
  date: r.date,
  type: r.type,
});

export async function getWeeklyRules(slug: string): Promise<WeeklyRule[]> {
  const rows = await all<RuleRow>(
    "SELECT * FROM weekly_rules WHERE practitioner_slug = ? ORDER BY weekday, start_time",
    slug,
  );
  return rows.map(toRule);
}

export async function getTimeOff(slug: string): Promise<TimeOff[]> {
  const rows = await all<TimeOffRow>("SELECT * FROM time_off WHERE practitioner_slug = ? ORDER BY start_date", slug);
  return rows.map(toTimeOff);
}

/** Whether a new [startTime, endTime) recurring slot on this weekday would overlap an existing one. */
export async function weeklyRuleOverlaps(
  slug: string,
  weekday: number,
  startTime: string,
  endTime: string,
  excludeId?: string,
): Promise<boolean> {
  const row = await first(
    `SELECT 1 FROM weekly_rules
      WHERE practitioner_slug = ? AND weekday = ? AND start_time < ? AND end_time > ?
        AND (?5 IS NULL OR id <> ?5)
      LIMIT 1`,
    slug,
    weekday,
    endTime,
    startTime,
    excludeId,
  );
  return row !== null;
}

/** Adds one more recurring slot to a weekday — a day can carry any number of these. */
export async function addWeeklyRule(
  slug: string,
  weekday: number,
  data: { startTime: string; endTime: string; sessionType: SlotSessionType },
): Promise<void> {
  await run(
    "INSERT INTO weekly_rules (practitioner_slug, weekday, start_time, end_time, session_type) VALUES (?, ?, ?, ?, ?)",
    slug,
    weekday,
    data.startTime,
    data.endTime,
    data.sessionType,
  );
}

export async function updateWeeklyRule(
  slug: string,
  id: string,
  data: { startTime: string; endTime: string; sessionType: SlotSessionType },
): Promise<void> {
  await run(
    "UPDATE weekly_rules SET start_time = ?, end_time = ?, session_type = ? WHERE id = ? AND practitioner_slug = ?",
    data.startTime,
    data.endTime,
    data.sessionType,
    id,
    slug,
  );
}

export async function removeWeeklyRule(slug: string, id: string): Promise<void> {
  await run("DELETE FROM weekly_rules WHERE id = ? AND practitioner_slug = ?", id, slug);
}

export async function addTimeOff(slug: string, startDate: string, endDate: string, label: string): Promise<void> {
  await run(
    "INSERT INTO time_off (practitioner_slug, start_date, end_date, label) VALUES (?, ?, ?, ?)",
    slug,
    startDate,
    endDate,
    label,
  );
}

export async function removeTimeOff(slug: string, id: string): Promise<TimeOff | null> {
  const row = await first<TimeOffRow>(
    "DELETE FROM time_off WHERE id = ? AND practitioner_slug = ? RETURNING *",
    id,
    slug,
  );
  return row ? toTimeOff(row) : null;
}

function isWithinAnyTimeOff(date: string, offs: TimeOff[]): boolean {
  return offs.some((o) => date >= o.startDate && date <= o.endDate);
}

export async function getDayOverride(slug: string, date: string): Promise<DayOverride | null> {
  const row = await first<OverrideRow>(
    "SELECT * FROM day_overrides WHERE practitioner_slug = ? AND date = ?",
    slug,
    date,
  );
  return row ? toOverride(row) : null;
}

export async function getDayOverrides(slug: string): Promise<DayOverride[]> {
  const rows = await all<OverrideRow>("SELECT * FROM day_overrides WHERE practitioner_slug = ? ORDER BY date", slug);
  return rows.map(toOverride);
}

/** Marks a date as no longer following the weekly pattern — custom hours or fully unavailable. */
export async function setDayOverride(slug: string, date: string, type: DayOverride["type"]): Promise<void> {
  await run(
    `INSERT INTO day_overrides (practitioner_slug, date, type) VALUES (?, ?, ?)
       ON CONFLICT (practitioner_slug, date) DO UPDATE SET type = excluded.type`,
    slug,
    date,
    type,
  );
}

export async function clearDayOverride(slug: string, date: string): Promise<void> {
  await run("DELETE FROM day_overrides WHERE practitioner_slug = ? AND date = ?", slug, date);
}

/** Drops that date back to the weekly pattern: clears its override, its non-booked slots, and refills it from the rules. */
export async function resetDateToWeeklyHours(slug: string, date: string): Promise<void> {
  await clearDayOverride(slug, date);
  await run("DELETE FROM slots WHERE practitioner_slug = ? AND date = ? AND status <> 'booked'", slug, date);
  await generateUpcomingSlots(slug);
}

/** Fills open slots for the next few weeks from the weekly pattern, skipping time off and anything already there. */
export async function generateUpcomingSlots(slug: string): Promise<void> {
  const rules = await getWeeklyRules(slug);
  if (rules.length === 0) return;

  // "Today" is today for this practitioner, on their own clock, not the server's.
  const zone = zoneOrDefault((await first<{ timezone: string }>("SELECT timezone FROM practitioners WHERE slug = ?", slug))?.timezone);
  const today = todayIn(zone);
  const lastDay = addDays(today, WEEKS_AHEAD * 7 - 1);
  const [offs, overrides, existing] = await Promise.all([
    getTimeOff(slug),
    getDayOverrides(slug),
    all<{ date: string; start_time: string; end_time: string }>(
      "SELECT date, start_time, end_time FROM slots WHERE practitioner_slug = ? AND date BETWEEN ? AND ?",
      slug,
      today,
      lastDay,
    ),
  ]);
  const overriddenDates = new Set(overrides.map((o) => o.date));

  const taken = new Map<string, { startTime: string; endTime: string }[]>();
  for (const s of existing) {
    const list = taken.get(s.date) ?? [];
    list.push({ startTime: s.start_time, endTime: s.end_time });
    taken.set(s.date, list);
  }

  const rulesByWeekday = new Map<number, WeeklyRule[]>();
  for (const rule of rules) {
    const bucket = rulesByWeekday.get(rule.weekday);
    if (bucket) bucket.push(rule);
    else rulesByWeekday.set(rule.weekday, [rule]);
  }

  const toAdd: Parameters<typeof addSlots>[0] = [];
  for (let i = 0; i < WEEKS_AHEAD * 7; i++) {
    const date = addDays(today, i);
    if (isWithinAnyTimeOff(date, offs)) continue;
    if (overriddenDates.has(date)) continue;

    const weekday = new Date(`${date}T00:00:00`).getDay();
    const dayRules = rulesByWeekday.get(weekday);
    if (!dayRules) continue;

    const dayTaken = taken.get(date) ?? [];
    for (const rule of dayRules) {
      if (dayTaken.some((t) => t.startTime < rule.endTime && rule.startTime < t.endTime)) continue;
      dayTaken.push({ startTime: rule.startTime, endTime: rule.endTime });
      toAdd.push({
        practitionerSlug: slug,
        date,
        startTime: rule.startTime,
        endTime: rule.endTime,
        sessionType: rule.sessionType,
      });
    }
    taken.set(date, dayTaken);
  }

  await addSlots(toAdd);
}

/** Marks any already-open slots inside a time-off range as unavailable (never touches booked ones). */
export async function blockOpenSlotsInRange(slug: string, startDate: string, endDate: string): Promise<void> {
  await run(
    "UPDATE slots SET status = 'unavailable' WHERE practitioner_slug = ? AND status = 'open' AND date BETWEEN ? AND ?",
    slug,
    startDate,
    endDate,
  );
}

/** Reopens slots that were auto-blocked by a time-off range that's now been removed. */
export async function releaseSlotsInRange(slug: string, startDate: string, endDate: string): Promise<void> {
  const [stillOff, rows] = await Promise.all([
    getTimeOff(slug),
    all<{ id: string; date: string }>(
      "SELECT id, date FROM slots WHERE practitioner_slug = ? AND status = 'unavailable' AND date BETWEEN ? AND ?",
      slug,
      startDate,
      endDate,
    ),
  ]);
  await setSlotsStatus(
    rows.filter((s) => !isWithinAnyTimeOff(s.date, stillOff)).map((s) => s.id),
    "open",
  );
}
