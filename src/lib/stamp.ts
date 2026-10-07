import { wallClockIn, zoneTag } from "@/lib/time";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayText(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function clockText(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/**
 * A stored moment (an ISO timestamp, always UTC) as text for whoever is reading it: "7 Oct 2026, 1:51 PM PKT" in the
 * `zone` given, usually the reader's own device zone. With no zone (the server, and a page's first render) it reads in
 * UTC and says so, rather than letting UTC pass for local time. A plain date has no time and no zone.
 */
export function formatStamp(iso: string, zone?: string): string {
  if (iso.length <= 10) return dayText(iso);
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  if (!zone) {
    const utc = at.toISOString();
    return `${dayText(utc.slice(0, 10))}, ${clockText(utc.slice(11, 16))} UTC`;
  }
  const local = wallClockIn(zone, at.getTime());
  return `${dayText(local.date)}, ${clockText(local.time)} ${zoneTag(zone, at)}`;
}
