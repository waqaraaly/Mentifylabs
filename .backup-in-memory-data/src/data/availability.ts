import type { SlotSessionType } from "@/lib/sessionType";
import type { WeeklyRule, TimeOff, DayOverride } from "@/types/availability";
import { addSlot, deleteSlot, getSlotsByPractitioner, setSlotStatus, slotsOverlap } from "./slots";
import { addDays, todayIsoDate } from "@/lib/format";

/**
 * In-memory data source (module-level array). Swap the bodies below for
 * Cloudflare D1 queries once the schema exists — every function is async
 * on purpose so call sites never change.
 */
const RULES: WeeklyRule[] = [
  { id: "rule-1", practitionerSlug: "dr-ali", weekday: 1, startTime: "09:00", endTime: "09:50", sessionType: "online" },
  { id: "rule-2", practitionerSlug: "dr-ali", weekday: 1, startTime: "10:00", endTime: "10:50", sessionType: "offline" },
  { id: "rule-3", practitionerSlug: "dr-ali", weekday: 1, startTime: "14:00", endTime: "14:50", sessionType: "both" },
  { id: "rule-4", practitionerSlug: "dr-ali", weekday: 2, startTime: "09:00", endTime: "09:50", sessionType: "online" },
  { id: "rule-5", practitionerSlug: "dr-ali", weekday: 2, startTime: "10:00", endTime: "10:50", sessionType: "offline" },
  { id: "rule-6", practitionerSlug: "dr-ali", weekday: 2, startTime: "14:00", endTime: "14:50", sessionType: "both" },
  { id: "rule-7", practitionerSlug: "dr-ali", weekday: 3, startTime: "09:00", endTime: "09:50", sessionType: "online" },
  { id: "rule-8", practitionerSlug: "dr-ali", weekday: 3, startTime: "10:00", endTime: "10:50", sessionType: "offline" },
  { id: "rule-9", practitionerSlug: "dr-ali", weekday: 3, startTime: "14:00", endTime: "14:50", sessionType: "both" },
  { id: "rule-10", practitionerSlug: "dr-ali", weekday: 4, startTime: "09:00", endTime: "09:50", sessionType: "online" },
  { id: "rule-11", practitionerSlug: "dr-ali", weekday: 4, startTime: "10:00", endTime: "10:50", sessionType: "offline" },
  { id: "rule-12", practitionerSlug: "dr-ali", weekday: 4, startTime: "14:00", endTime: "14:50", sessionType: "both" },
  { id: "rule-13", practitionerSlug: "dr-ali", weekday: 5, startTime: "09:00", endTime: "09:50", sessionType: "online" },
  { id: "rule-14", practitionerSlug: "dr-ali", weekday: 5, startTime: "10:00", endTime: "10:50", sessionType: "offline" },
  { id: "rule-15", practitionerSlug: "dr-ali", weekday: 5, startTime: "14:00", endTime: "14:50", sessionType: "both" },
  { id: "rule-16", practitionerSlug: "dr-ali", weekday: 3, startTime: "16:00", endTime: "16:50", sessionType: "online" },
  { id: "rule-17", practitionerSlug: "dr-ali", weekday: 6, startTime: "10:00", endTime: "10:50", sessionType: "offline" },
];
const TIME_OFF: TimeOff[] = [];
const DAY_OVERRIDES: DayOverride[] = [
  { id: "override-1", practitionerSlug: "dr-ali", date: "2026-09-24", type: "custom" },
  { id: "override-2", practitionerSlug: "dr-ali", date: "2026-09-25", type: "custom" },
  { id: "override-3", practitionerSlug: "dr-ali", date: "2026-09-26", type: "custom" },
  { id: "override-4", practitionerSlug: "dr-ali", date: "2026-09-29", type: "unavailable" },
  { id: "override-5", practitionerSlug: "dr-ali", date: "2026-10-02", type: "unavailable" },
  { id: "override-6", practitionerSlug: "dr-ali", date: "2026-10-05", type: "custom" },
  { id: "override-7", practitionerSlug: "dr-ali", date: "2026-10-09", type: "custom" },
];

let nextRuleId = 18;
let nextOffId = 1;
let nextOverrideId = 8;

const WEEKS_AHEAD = 8;

export async function getWeeklyRules(slug: string): Promise<WeeklyRule[]> {
  return RULES.filter((r) => r.practitionerSlug === slug).sort(
    (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
  );
}

export async function getTimeOff(slug: string): Promise<TimeOff[]> {
  return TIME_OFF.filter((t) => t.practitionerSlug === slug).sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
}

/** Whether a new [startTime, endTime) recurring slot on this weekday would overlap an existing one. */
export async function weeklyRuleOverlaps(
  slug: string,
  weekday: number,
  startTime: string,
  endTime: string,
  excludeId?: string,
): Promise<boolean> {
  return RULES.some(
    (r) =>
      r.practitionerSlug === slug &&
      r.weekday === weekday &&
      r.id !== excludeId &&
      r.startTime < endTime &&
      startTime < r.endTime,
  );
}

/** Adds one more recurring slot to a weekday — a day can carry any number of these. */
export async function addWeeklyRule(
  slug: string,
  weekday: number,
  data: { startTime: string; endTime: string; sessionType: SlotSessionType },
): Promise<void> {
  RULES.push({ id: `rule-${nextRuleId++}`, practitionerSlug: slug, weekday, ...data });
}

export async function updateWeeklyRule(
  slug: string,
  id: string,
  data: { startTime: string; endTime: string; sessionType: SlotSessionType },
): Promise<void> {
  const rule = RULES.find((r) => r.id === id && r.practitionerSlug === slug);
  if (rule) Object.assign(rule, data);
}

export async function removeWeeklyRule(slug: string, id: string): Promise<void> {
  const index = RULES.findIndex((r) => r.id === id && r.practitionerSlug === slug);
  if (index !== -1) RULES.splice(index, 1);
}

export async function addTimeOff(
  slug: string,
  startDate: string,
  endDate: string,
  label: string,
): Promise<void> {
  TIME_OFF.push({ id: `off-${nextOffId++}`, practitionerSlug: slug, startDate, endDate, label });
}

export async function removeTimeOff(id: string): Promise<TimeOff | null> {
  const index = TIME_OFF.findIndex((t) => t.id === id);
  if (index === -1) return null;
  const [removed] = TIME_OFF.splice(index, 1);
  return removed;
}

function isWithinAnyTimeOff(date: string, offs: TimeOff[]): boolean {
  return offs.some((o) => date >= o.startDate && date <= o.endDate);
}

export async function getDayOverride(slug: string, date: string): Promise<DayOverride | null> {
  return DAY_OVERRIDES.find((o) => o.practitionerSlug === slug && o.date === date) ?? null;
}

export async function getDayOverrides(slug: string): Promise<DayOverride[]> {
  return DAY_OVERRIDES.filter((o) => o.practitionerSlug === slug).sort((a, b) => a.date.localeCompare(b.date));
}

/** Marks a date as no longer following the weekly pattern — custom hours or fully unavailable. */
export async function setDayOverride(slug: string, date: string, type: DayOverride["type"]): Promise<void> {
  const existing = DAY_OVERRIDES.find((o) => o.practitionerSlug === slug && o.date === date);
  if (existing) existing.type = type;
  else DAY_OVERRIDES.push({ id: `override-${nextOverrideId++}`, practitionerSlug: slug, date, type });
}

export async function clearDayOverride(slug: string, date: string): Promise<void> {
  const index = DAY_OVERRIDES.findIndex((o) => o.practitionerSlug === slug && o.date === date);
  if (index !== -1) DAY_OVERRIDES.splice(index, 1);
}

/** Drops that date back to the weekly pattern: clears its override, its non-booked slots, and refills it from the rules. */
export async function resetDateToWeeklyHours(slug: string, date: string): Promise<void> {
  await clearDayOverride(slug, date);
  const slots = await getSlotsByPractitioner(slug);
  for (const s of slots) {
    if (s.date === date && s.status !== "booked") {
      await deleteSlot(s.id);
    }
  }
  await generateUpcomingSlots(slug);
}

/** Fills open slots for the next few weeks from the weekly pattern, skipping time off and anything already there. */
export async function generateUpcomingSlots(slug: string): Promise<void> {
  const rules = await getWeeklyRules(slug);
  if (rules.length === 0) return;

  const offs = await getTimeOff(slug);
  const overriddenDates = new Set((await getDayOverrides(slug)).map((o) => o.date));
  const today = todayIsoDate();
  const rulesByWeekday = new Map<number, WeeklyRule[]>();
  for (const rule of rules) {
    const bucket = rulesByWeekday.get(rule.weekday);
    if (bucket) bucket.push(rule);
    else rulesByWeekday.set(rule.weekday, [rule]);
  }

  for (let i = 0; i < WEEKS_AHEAD * 7; i++) {
    const date = addDays(today, i);
    if (isWithinAnyTimeOff(date, offs)) continue;
    if (overriddenDates.has(date)) continue;

    const weekday = new Date(`${date}T00:00:00`).getDay();
    const dayRules = rulesByWeekday.get(weekday);
    if (!dayRules) continue;

    for (const rule of dayRules) {
      if (await slotsOverlap(slug, date, rule.startTime, rule.endTime)) continue;

      await addSlot({
        practitionerSlug: slug,
        date,
        startTime: rule.startTime,
        endTime: rule.endTime,
        sessionType: rule.sessionType,
      });
    }
  }
}

/** Marks any already-open slots inside a time-off range as unavailable (never touches booked ones). */
export async function blockOpenSlotsInRange(slug: string, startDate: string, endDate: string): Promise<void> {
  const slots = await getSlotsByPractitioner(slug);
  for (const s of slots) {
    if (s.date >= startDate && s.date <= endDate && s.status === "open") {
      await setSlotStatus(s.id, "unavailable");
    }
  }
}

/** Reopens slots that were auto-blocked by a time-off range that's now been removed. */
export async function releaseSlotsInRange(slug: string, startDate: string, endDate: string): Promise<void> {
  const stillOff = await getTimeOff(slug);
  const slots = await getSlotsByPractitioner(slug);
  for (const s of slots) {
    if (
      s.date >= startDate &&
      s.date <= endDate &&
      s.status === "unavailable" &&
      !isWithinAnyTimeOff(s.date, stillOff)
    ) {
      await setSlotStatus(s.id, "open");
    }
  }
}

/** Re-points a practitioner's weekly rules, time off and day overrides at their new slug after a rename. */
export async function renameAvailabilitySlug(from: string, to: string): Promise<void> {
  for (const list of [RULES, TIME_OFF, DAY_OVERRIDES]) {
    for (const item of list) if (item.practitionerSlug === from) item.practitionerSlug = to;
  }
}
