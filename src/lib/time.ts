/**
 * Time zones, done the standard way.
 *
 * - A zone is always a named IANA zone ("Asia/Karachi", "America/New_York"), never an offset or an abbreviation.
 * - Nothing here asks "what zone am I running in?". The server runs on UTC and a browser runs on its owner's zone, so
 *   any code that read the runtime's own clock gave different answers in different places. Every function takes the zone.
 * - Slots and appointments are stored as a plain date and time on the practitioner's own clock. This module turns that
 *   into a real moment (`instantOf`) or into someone else's clock (`wallClockIn`) only when it has to.
 *
 * It uses the platform's built-in time zone data (`Intl`), so daylight-saving rules and new zones need no code here.
 */

const FALLBACK_TIMEZONE = "Asia/Karachi";

export function isValidTimeZone(zone: string | null | undefined): zone is string {
  if (!zone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The zone a practitioner starts with, and what admin pages count "today" in. One setting for the whole deployment. */
export const DEFAULT_TIMEZONE: string = isValidTimeZone(process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE)
  ? (process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE as string)
  : FALLBACK_TIMEZONE;

/** A saved zone if it is a real one, otherwise the default, so a bad value can never break a page. */
export const zoneOrDefault = (zone: string | null | undefined): string => (isValidTimeZone(zone) ? zone : DEFAULT_TIMEZONE);

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatterFor(zone: string): Intl.DateTimeFormat {
  let f = formatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(zone, f);
  }
  return f;
}

interface Parts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function partsIn(zone: string, ms: number): Parts {
  const out: Record<string, number> = {};
  for (const p of formatterFor(zone).formatToParts(new Date(ms))) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  // Some engines write midnight as 24 even with h23; fold it back.
  return { year: out.year, month: out.month, day: out.day, hour: out.hour % 24, minute: out.minute, second: out.second };
}

const two = (n: number) => String(n).padStart(2, "0");

/** The date and time on a clock in `zone` at this moment: `{ date: "2026-10-06", time: "10:05", minutes: 605 }`. */
export function wallClockIn(zone: string, at: Date | number = new Date()): { date: string; time: string; minutes: number } {
  const p = partsIn(zone, typeof at === "number" ? at : at.getTime());
  return { date: `${p.year}-${two(p.month)}-${two(p.day)}`, time: `${two(p.hour)}:${two(p.minute)}`, minutes: p.hour * 60 + p.minute };
}

/** Today's date, as someone in `zone` would say it. */
export const todayIn = (zone: string, at: Date | number = new Date()): string => wallClockIn(zone, at).date;

/** The calendar day a real moment (an ISO timestamp, like when a request arrived) falls on in `zone`. */
export const dayOfIn = (iso: string, zone: string): string => wallClockIn(zone, Date.parse(iso)).date;

/** How far ahead of UTC a clock in `zone` is at this moment, in milliseconds. */
function offsetMs(zone: string, ms: number): number {
  const whole = Math.floor(ms / 1000) * 1000;
  const p = partsIn(zone, whole);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - whole;
}

/**
 * The real moment (milliseconds since 1970, UTC) at which a clock in `zone` reads this date and time.
 * Around a daylight-saving change the clock is not one-to-one: the hour it skips has no moment, and the hour it repeats
 * has two. A skipped time resolves to just after the gap, and a repeated one to the first of the two.
 */
export function instantOf(date: string, time: string, zone: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const asIfUtc = Date.UTC(y, m - 1, d, h, min);
  const DAY = 24 * 60 * 60 * 1000;
  const before = offsetMs(zone, asIfUtc - DAY); // the offset in force a day earlier
  const after = offsetMs(zone, asIfUtc + DAY); // and a day later
  const atOffset = (off: number) => asIfUtc - off;
  const reads = (instant: number) => {
    const c = wallClockIn(zone, instant);
    return c.date === date && c.time === time;
  };
  if (before === after) return atOffset(before); // no change nearby
  if (reads(atOffset(before))) return atOffset(before); // an ordinary time before the change, or the first of a repeated pair
  if (reads(atOffset(after))) return atOffset(after); // an ordinary time after it
  return atOffset(before); // in the skipped hour: just after the gap
}

/** Whether a session starting at this date and time on a clock in `zone` has already started. */
export function isPastIn(date: string, time: string, zone: string, now: Date | number = new Date()): boolean {
  const here = wallClockIn(zone, now);
  return date < here.date || (date === here.date && time <= here.time);
}

/** "Good morning", "Good afternoon" or "Good evening" by the hour in `zone`. */
export function greetingIn(zone: string, now: Date | number = new Date()): string {
  const hour = Math.floor(wallClockIn(zone, now).minutes / 60);
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Abbreviations people in that country would recognise and that the platform's own naming doesn't produce.
const TAG_OVERRIDES: Record<string, string> = { "Asia/Karachi": "PKT", UTC: "UTC" };

/** A short tag for the zone at that moment: "PKT", "EDT", or "GMT+1" where there isn't a common abbreviation. */
export function zoneTag(zone: string, at: Date | number = new Date()): string {
  if (TAG_OVERRIDES[zone]) return TAG_OVERRIDES[zone];
  const name = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "short" })
    .formatToParts(new Date(typeof at === "number" ? at : at.getTime()))
    .find((p) => p.type === "timeZoneName")?.value;
  return name ?? zone;
}

/** "UTC+5", "UTC+5:30", "UTC-4" for an offset in minutes. */
function offsetText(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${two(m)}` : ""}`;
}

/** "UTC+5", "UTC+5:30", "UTC-4" for the zone at that moment. */
export function offsetLabel(zone: string, at: Date | number = new Date()): string {
  return offsetText(Math.round(offsetMs(zone, typeof at === "number" ? at : at.getTime()) / 60000));
}

/** The zone this device is set to, if it reports a real one. Used to pre-fill the choice, never to override it. */
export function deviceTimeZone(): string | undefined {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimeZone(zone) ? zone : undefined;
  } catch {
    return undefined;
  }
}

/** Every zone the platform knows, as picker options like "Asia/Karachi (UTC+5)", ordered by offset then name. */
export function timeZoneOptions(at: Date | number = new Date()): { value: string; label: string }[] {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  const names = intl.supportedValuesOf ? intl.supportedValuesOf("timeZone") : [DEFAULT_TIMEZONE, "UTC"];
  const moment = typeof at === "number" ? at : at.getTime();
  // Each zone's offset is worked out once, and the label is made from it, since this runs over every zone there is.
  const withOffset = names.map((value) => ({ value, offset: offsetMs(value, moment) }));
  withOffset.sort((a, b) => a.offset - b.offset || a.value.localeCompare(b.value));
  return withOffset.map(({ value, offset }) => ({ value, label: `${value.replace(/_/g, " ")} (${offsetText(Math.round(offset / 60000))})` }));
}
