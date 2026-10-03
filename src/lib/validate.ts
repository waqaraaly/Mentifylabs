/** Strict formats for the date and time strings the calendar stores ("2026-10-02", "09:30"). */
export const isIsoDate = (value: string | undefined | null): value is string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

export const isTimeOfDay = (value: string | undefined | null): value is string =>
  !!value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

/** A usable start/end pair: both well-formed and the end after the start. */
export function validTimeRange(startTime: string | undefined, endTime: string | undefined): string | null {
  if (!isTimeOfDay(startTime) || !isTimeOfDay(endTime)) return "Enter valid times.";
  if (startTime >= endTime) return "End time must be after the start time.";
  return null;
}

/** Longest values accepted from the public booking form. */
export const BOOKING_LIMITS = { name: 100, contact: 60, concern: 1000 } as const;
