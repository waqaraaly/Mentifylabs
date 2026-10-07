import { instantOf, isPastIn, wallClockIn, zoneTag } from "@/lib/time";

/** A slot's date and times, as plain wall-clock strings on some clock. */
export interface SlotTimes {
  date: string;
  startTime: string;
  endTime: string;
}

export interface ShownTimes extends SlotTimes {
  /** The zone these times are shown in. */
  zone: string;
  /** Its short tag at that moment, such as "PKT" or "EDT". */
  tag: string;
}

/**
 * A slot written on the practitioner's clock (`fromZone`), as it reads on another clock (`toZone`). The date can change:
 * a 2 AM Tuesday slot in Karachi is Monday afternoon in New York, so everything that groups by day has to group by this.
 */
export function shownIn(times: SlotTimes, fromZone: string, toZone: string): ShownTimes {
  const startMs = instantOf(times.date, times.startTime, fromZone);
  const tag = zoneTag(toZone, startMs);
  if (fromZone === toZone) return { ...times, zone: toZone, tag };
  const start = wallClockIn(toZone, startMs);
  const end = wallClockIn(toZone, instantOf(times.date, times.endTime, fromZone));
  return { date: start.date, startTime: start.time, endTime: end.time, zone: toZone, tag };
}

/**
 * The clock a visitor should see a slot on. Online sessions follow the visitor, wherever they are. A session in person
 * is where the practitioner is, so it stays on the practitioner's clock whatever the visitor's device says.
 */
export function displayZoneFor(sessionType: "online" | "offline" | "both" | null, practitionerZone: string, viewerZone: string): string {
  return sessionType === "offline" ? practitionerZone : viewerZone;
}

/**
 * The format the booking window should open on. It is the format of the earliest slot, the same one the "Next available"
 * bar names, so the date the bar shows is on the first screen. A slot that fits either format opens on Online when that is
 * offered. Only a format that is actually offered is returned.
 */
export function openingFormat(
  slots: (SlotTimes & { sessionType: "online" | "offline" | "both" })[],
  offers: { online: boolean; offline: boolean },
): "online" | "offline" | null {
  const earliest = [...slots].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0];
  const wanted = earliest ? (earliest.sessionType === "offline" ? "offline" : "online") : null;
  if (wanted === "offline" && offers.offline) return "offline";
  if (wanted === "online" && offers.online) return "online";
  return offers.online ? "online" : offers.offline ? "offline" : null;
}

/** Slots that have not started yet, judged on the practitioner's clock. */
export function notStarted<T extends SlotTimes>(slots: T[], practitionerZone: string, now: Date | number = new Date()): T[] {
  return slots.filter((s) => !isPastIn(s.date, s.startTime, practitionerZone, now));
}

/** The earliest slot that has not started yet. */
export function nextAvailable<T extends SlotTimes>(slots: T[], practitionerZone: string, now: Date | number = new Date()): T | null {
  return [...notStarted(slots, practitionerZone, now)].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0] ?? null;
}
