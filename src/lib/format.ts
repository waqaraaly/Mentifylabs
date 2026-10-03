const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAYS_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Deterministic, locale-independent formatting: `toLocaleDateString` resolves
// to the server's locale during SSR and the browser's locale on the client,
// which can differ and causes a hydration mismatch.
export function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatDateFull(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return `${WEEKDAYS_FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatDayCell(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return { weekday: WEEKDAYS[d.getDay()], day: d.getDate(), month: MONTHS[d.getMonth()] };
}

// Both of these stay in local time throughout — going via toISOString() (UTC)
// would silently shift the date whenever the runtime's UTC offset pushes
// midnight across a day boundary, and server (Node) vs. client (browser) can
// each have a different local timezone, so that shift isn't even consistent
// between the two.
function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIsoDate() {
  return toIsoDate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

export function getDateRange(startIso: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(startIso, i));
}

export function mondayOf(dateIso: string): string {
  const day = new Date(`${dateIso}T00:00:00`).getDay(); // 0=Sun..6=Sat
  return addDays(dateIso, -((day + 6) % 7));
}

export function isToday(iso: string) {
  return iso === todayIsoDate();
}

/** Whether a session starting on this date and time (on the practitioner's own clock) is already in the past. */
export function isPastStart(date: string, startTime: string, now: Date = new Date()): boolean {
  return new Date(`${date}T${startTime}:00`) < now;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${hours}:${minutes}`;
}

export function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function monthOf(dateIso: string): string {
  return dateIso.slice(0, 7);
}

export function addMonths(monthIso: string, delta: number): string {
  const [y, m] = monthIso.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(monthIso: string): string {
  const [y, m] = monthIso.split("-").map(Number);
  return `${MONTHS_FULL[m - 1]} ${y}`;
}

// 6x7 grid of ISO date strings (or null for padding) for the given "YYYY-MM" month.
export function getMonthGrid(monthIso: string): (string | null)[][] {
  const [y, m] = monthIso.split("-").map(Number);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const totalDays = new Date(y, m, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// "09:00" -> "10:30" => 90 (minutes)
export function diffMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

// "14:00" -> "2:00 PM"
/** The calendar day (viewer's local time) a timestamp falls on, as YYYY-MM-DD. */
export function localDayOf(iso: string): string {
  return toIsoDate(new Date(iso));
}

/** A day for a group heading: "today", "yesterday", or "Friday, Sep 12". */
export function formatDayHeading(dayIso: string): string {
  const days = daysBetween(dayIso, todayIsoDate());
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return formatDateFull(dayIso);
}

/** The exact moment a request came in, in the viewer's local time: "Fri, Sep 12 at 3:42 PM". */
export function formatRequestedAt(createdAtIso: string): string {
  const d = new Date(createdAtIso);
  const year = d.getFullYear() === new Date().getFullYear() ? "" : `, ${d.getFullYear()}`;
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}${year} at ${formatTime12h(`${d.getHours()}:${d.getMinutes()}`)}`;
}

export function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// "09:00","09:50" => "9:00 – 9:50 AM" (the period is shown once when both ends share it)
export function formatRange12h(startTime: string, endTime: string): string {
  const samePeriod = Number(startTime.split(":")[0]) >= 12 === Number(endTime.split(":")[0]) >= 12;
  const start = samePeriod ? formatTime12h(startTime).replace(/ (AM|PM)$/, "") : formatTime12h(startTime);
  return `${start} – ${formatTime12h(endTime)}`;
}
