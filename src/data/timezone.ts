import { first, run } from "@/lib/db";
import { generateUpcomingSlots } from "@/data/availability";
import { getPractitionerBySlug } from "@/data/practitioners";
import { isValidTimeZone, wallClockIn } from "@/lib/time";

/** Pending or confirmed sessions that haven't finished yet, counted on the practitioner's own clock. */
export async function upcomingSessionCount(slug: string, zone: string): Promise<number> {
  const here = wallClockIn(zone);
  const row = await first<{ n: number }>(
    `SELECT count(*) AS n FROM appointments
      WHERE practitioner_slug = ? AND status IN ('pending', 'confirmed')
        AND (date > ? OR (date = ? AND end_time > ?))`,
    slug,
    here.date,
    here.date,
    here.time,
  );
  return row?.n ?? 0;
}

/**
 * Changes the clock a practitioner works on. It is refused while they have upcoming sessions, so no booked time is ever
 * reinterpreted: a session one person booked for 10:00 would otherwise mean a different moment afterwards.
 * Slots are plain dates and times on this clock, so nothing else needs rewriting; the open slots for the coming weeks
 * are topped up from the weekly hours.
 */
export async function changePractitionerTimezone(slug: string, zone: string): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isValidTimeZone(zone)) return { ok: false, message: "Choose a time zone from the list." };
  const current = await getPractitionerBySlug(slug);
  if (!current) return { ok: false, message: "Profile not found." };
  if (current.timezone === zone) return { ok: true };

  const upcoming = await upcomingSessionCount(slug, current.timezone);
  if (upcoming > 0) {
    return {
      ok: false,
      message: `You have ${upcoming} upcoming ${upcoming === 1 ? "session" : "sessions"}. Complete or cancel ${upcoming === 1 ? "it" : "them"} first, so the booked times don't change.`,
    };
  }

  await run("UPDATE practitioners SET timezone = ? WHERE slug = ?", zone, slug);
  await generateUpcomingSlots(slug);
  return { ok: true };
}
