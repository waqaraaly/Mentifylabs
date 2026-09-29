import type { SlotSessionType } from "@/lib/sessionType";

/** A repeating weekly "I'm usually free" slot — a weekday can carry any number of these. */
export interface WeeklyRule {
  id: string;
  practitionerSlug: string;
  weekday: number; // 0 = Sunday .. 6 = Saturday
  startTime: string;
  endTime: string;
  sessionType: SlotSessionType;
}

/** A stretch of days marked as time off (holiday, leave, etc). */
export interface TimeOff {
  id: string;
  practitionerSlug: string;
  startDate: string;
  endDate: string;
  label: string;
}

/**
 * A single date that no longer follows the weekly pattern:
 * "custom" — she set her own hours for just this date.
 * "unavailable" — the whole date is blocked off.
 */
export interface DayOverride {
  id: string;
  practitionerSlug: string;
  date: string;
  type: "custom" | "unavailable";
}
