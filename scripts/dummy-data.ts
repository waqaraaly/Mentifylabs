// Fills one practitioner's account with made-up data so every portal page has something to show: appointments in every
// state, profile visits, time off, and any profile fields still empty. LOCAL DATABASE ONLY.
//
//   npm run dummy:local -- --email you@example.com
//   npm run dummy:local -- --email you@example.com --remove
//
// Everything it adds is recognisable, so --remove takes it away again without touching real data:
//   appointments  clients with a +92 300 5550xxx phone number
//   visits        visitor ids starting "demo-"
//   time off      labelled "Conference (sample)"
// Profile fields are only filled where they are empty, and --remove leaves them (they are yours to edit).
// It refuses to run against a remote database: made-up clients on a live account would show on a real page.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { instantOf, wallClockIn, zoneOrDefault } from "../src/lib/time.ts";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    remove: { type: "boolean", default: false },
    remote: { type: "boolean", default: false },
    env: { type: "string" },
  },
});

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

if (values.remote || values.env) fail("This only runs against the local database. It will not touch a remote one.");
const email = values.email?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Pass --email you@example.com (the practitioner's sign-in email).");

const DATABASE = "mentifylabs-db";
const WRANGLER = join(import.meta.dirname, "..", "node_modules", "wrangler", "bin", "wrangler.js");
const q = (v: string | number) => (typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`);

function wrangler(args: string[]): { ok: boolean; out: string } {
  // Run wrangler's own entry file with node, so the SQL is passed as-is and no shell splits it at the spaces.
  const r = spawnSync(process.execPath, [WRANGLER, "d1", "execute", DATABASE, "--local", ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: { ...process.env, CI: "1" } });
  return { ok: r.status === 0, out: `${r.stdout}\n${r.stderr}` };
}

// ---- Who ----
const lookup = wrangler([
  "--json",
  "--command",
  `SELECT p.id, p.slug, p.timezone FROM users u JOIN practitioners p ON p.id = u.practitioner_id WHERE u.email = ${q(email)} AND u.role = 'practitioner'`,
]);
let practitioner: { id: string; slug: string; timezone: string } | undefined;
try {
  practitioner = JSON.parse(lookup.out.slice(lookup.out.indexOf("[")))[0]?.results?.[0];
} catch {
  practitioner = undefined;
}
if (!practitioner) fail(`No practitioner account for ${email} in the local database.`);
const slug = practitioner.slug;
const zone = zoneOrDefault(practitioner.timezone);

const PHONE_TAG = "+92 300 5550%";

// ---- Removing ----
const removeSql = `
UPDATE slots SET status = 'open' WHERE id IN (SELECT slot_id FROM appointments WHERE practitioner_slug = ${q(slug)} AND client_contact LIKE ${q(PHONE_TAG)} AND slot_id IS NOT NULL);
DELETE FROM appointments WHERE practitioner_slug = ${q(slug)} AND client_contact LIKE ${q(PHONE_TAG)};
DELETE FROM profile_views WHERE practitioner_slug = ${q(slug)} AND visitor LIKE 'demo-%';
DELETE FROM time_off WHERE practitioner_slug = ${q(slug)} AND label = 'Conference (sample)';
`;

// ---- Adding ----
const now = wallClockIn(zone);
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const roundTo = (minutes: number, step: number) => Math.round(minutes / step) * step;

/** A session `dayOffset` days from today on the practitioner's clock, starting at `startMinutes` after midnight. */
function session(dayOffset: number, startMinutes: number, duration = 50) {
  let day = dayOffset;
  let start = startMinutes;
  while (start < 0) { start += 1440; day -= 1; }
  while (start >= 1440) { start -= 1440; day += 1; }
  return { date: addDays(now.date, day), start: hhmm(start), end: hhmm(Math.min(start + duration, 1439)) };
}

const NAMES = [
  "Ayesha Khan", "Bilal Ahmed", "Hira Malik", "Usman Tariq", "Sana Rizvi", "Omar Farooq", "Maryam Javed", "Daniyal Iqbal",
  "Zainab Hussain", "Hamza Sheikh", "Noor Fatima", "Fahad Mirza", "Kamran Aziz", "Laiba Siddiqui", "Rabia Anwar", "Sidra Noor",
  "Talha Qureshi", "Mehwish Raza", "Adeel Butt", "Farah Naeem", "Saad Chaudhry", "Amna Yousuf", "Junaid Akhtar", "Iqra Saeed",
];
const CONCERNS = [
  "Struggling with anxiety at work and trouble sleeping.",
  "Looking for support after a recent loss.",
  "Panic attacks before exams.",
  "Relationship stress and difficulty communicating.",
  "Burnout and low motivation for the past few months.",
  "Trouble focusing since childhood. Wondering about an ADHD assessment.",
  "Feeling overwhelmed after moving to a new city.",
  "Intrusive thoughts that are getting in the way of daily life.",
];

type Status = "pending" | "confirmed" | "completed" | "cancelled";
interface Plan {
  status: Status;
  type: "online" | "offline";
  when: { date: string; start: string; end: string } | "next-open-slot";
  /** When the request arrived, as a moment; defaults to three days before the session. */
  createdAt?: Date;
}

const ago = (hours: number) => new Date(Date.now() - hours * 3600 * 1000);
const nowMin = now.minutes;
const plans: Plan[] = [
  // Today: one underway, two later, one already done
  { status: "confirmed", type: "online", when: session(0, roundTo(nowMin - 25, 5)), createdAt: ago(72) },
  { status: "confirmed", type: "offline", when: session(0, roundTo(nowMin + 90, 30)), createdAt: ago(60) },
  { status: "confirmed", type: "online", when: session(0, roundTo(nowMin + 240, 30)), createdAt: ago(50) },
  { status: "completed", type: "online", when: session(0, Math.max(roundTo(nowMin - 190, 5), 5)), createdAt: ago(100) },
  // Requests waiting for an answer, newest first in the inbox
  { status: "pending", type: "online", when: session(1, 11 * 60), createdAt: ago(1.5) },
  { status: "pending", type: "offline", when: session(1, 15 * 60 + 30), createdAt: ago(4) },
  { status: "pending", type: "online", when: session(2, 10 * 60), createdAt: ago(20) },
  { status: "pending", type: "offline", when: session(4, 16 * 60 + 30), createdAt: ago(30) },
  { status: "pending", type: "online", when: session(-1, 12 * 60), createdAt: ago(80) }, // the time has already passed
  // Two requests that take the next free slots on the Slots page
  { status: "pending", type: "online", when: "next-open-slot", createdAt: ago(6) },
  { status: "confirmed", type: "online", when: "next-open-slot", createdAt: ago(45) },
  // Confirmed ahead
  { status: "confirmed", type: "offline", when: session(1, 9 * 60 + 30), createdAt: ago(90) },
  { status: "confirmed", type: "online", when: session(2, 13 * 60), createdAt: ago(55) },
  { status: "confirmed", type: "online", when: session(5, 12 * 60), createdAt: ago(40) },
  // Confirmed but the time has passed and nobody marked them done (the Overdue tab)
  { status: "confirmed", type: "online", when: session(-1, 10 * 60), createdAt: ago(120) },
  { status: "confirmed", type: "offline", when: session(-3, 16 * 60), createdAt: ago(150) },
  // Cancelled
  { status: "cancelled", type: "online", when: session(-2, 11 * 60), createdAt: ago(110) },
  { status: "cancelled", type: "online", when: session(6, 12 * 60), createdAt: ago(30) },
  // History, so the Completed tab and the stats have weight
  ...[4, 7, 9, 14, 18, 23, 30, 38].map<Plan>((back, i) => ({
    status: "completed",
    type: i % 3 === 0 ? "offline" : "online",
    when: session(-back, (10 + (i % 5)) * 60 + (i % 2) * 30),
  })),
];

const appointmentSql = plans
  .map((plan, i) => {
    const name = NAMES[i % NAMES.length];
    const contact = `+92 300 5550${String(101 + i).padStart(3, "0")}`;
    const concern = CONCERNS[i % CONCERNS.length];
    const nextClient = "(SELECT 'CL-' || (COALESCE(MAX(CAST(substr(client_id, 4) AS INTEGER)), 1019) + 1) FROM appointments)";
    const created = (when: { date: string; start: string }) =>
      (plan.createdAt ?? new Date(instantOf(when.date, when.start, zone) - 3 * 24 * 3600 * 1000)).toISOString();

    if (plan.when === "next-open-slot") {
      // The next free slot after today, taken for real so the Slots page shows it as booked.
      return `
INSERT INTO appointments (client_id, practitioner_slug, slot_id, client_name, client_contact, concern, date, start_time, end_time, session_type, status, created_at)
SELECT ${nextClient}, ${q(slug)}, s.id, ${q(name)}, ${q(contact)}, ${q(concern)}, s.date, s.start_time, s.end_time,
       CASE WHEN s.session_type = 'both' THEN ${q(plan.type)} ELSE s.session_type END, ${q(plan.status)}, ${q(plan.createdAt!.toISOString())}
  FROM slots s WHERE s.practitioner_slug = ${q(slug)} AND s.status = 'open' AND s.date > ${q(now.date)}
 ORDER BY s.date, s.start_time LIMIT 1;
UPDATE slots SET status = 'booked' WHERE id = (SELECT slot_id FROM appointments WHERE practitioner_slug = ${q(slug)} AND client_contact = ${q(contact)}) AND status = 'open';`;
    }
    return `
INSERT INTO appointments (client_id, practitioner_slug, slot_id, client_name, client_contact, concern, date, start_time, end_time, session_type, status, created_at)
VALUES (${nextClient}, ${q(slug)}, NULL, ${q(name)}, ${q(contact)}, ${q(concern)}, ${q(plan.when.date)}, ${q(plan.when.start)}, ${q(plan.when.end)}, ${q(plan.type)}, ${q(plan.status)}, ${q(created(plan.when))});`;
  })
  .join("\n");

// Profile visits for the last 90 days: busier recently, quieter at weekends, mostly from Pakistan.
let seed = [...email].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
const random = () => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(weighted: [T, number][]): T => {
  const total = weighted.reduce((n, [, w]) => n + w, 0);
  let r = random() * total;
  for (const [value, weight] of weighted) if ((r -= weight) < 0) return value;
  return weighted[0][0];
};
const SOURCES: [string, number][] = [["Direct", 30], ["Search", 22], ["Instagram", 20], ["WhatsApp", 12], ["Facebook", 8], ["LinkedIn", 5], ["Email", 3]];
const COUNTRIES: [string, number][] = [["PK", 70], ["AE", 9], ["GB", 7], ["US", 6], ["SA", 5], ["CA", 3]];
const DEVICES: [string, number][] = [["mobile", 66], ["desktop", 28], ["tablet", 6]];

const visits: string[] = [];
let visitor = 0;
for (let back = 89; back >= 0; back--) {
  const day = new Date(Date.now() - back * 24 * 3600 * 1000);
  const weekend = [0, 6].includes(day.getUTCDay());
  const count = Math.max(1, Math.round(14 * (weekend ? 0.6 : 1) * (1 - back / 160) * (0.6 + random() * 0.8)));
  const dayText = day.toISOString().slice(0, 10);
  for (let n = 0; n < count; n++) {
    const at = `${dayText}T${String(Math.floor(random() * 24)).padStart(2, "0")}:${String(Math.floor(random() * 60)).padStart(2, "0")}:${String(Math.floor(random() * 60)).padStart(2, "0")}.000Z`;
    if (new Date(at).getTime() > Date.now()) continue; // nothing from the future
    visits.push(`(${q(slug)}, ${q(at)}, ${q(dayText)}, ${q(`demo-${(visitor += 1)}`)}, ${q(pick(SOURCES))}, ${q(pick(COUNTRIES))}, ${q(pick(DEVICES))})`);
  }
}
const visitSql: string[] = [];
for (let i = 0; i < visits.length; i += 100) {
  visitSql.push(`INSERT INTO profile_views (practitioner_slug, at, day, visitor, source, country, device) VALUES ${visits.slice(i, i + 100).join(",\n")};`);
}

const education = ["BSc (Hons) Psychology, University of the Punjab, 2010–2014", "MSc Clinical Psychology, University of the Punjab, 2014–2016", "M.Phil Clinical Psychology, University of the Punjab, 2016–2018"];
const experience = ["Clinical Psychologist, Mind & Wellness Clinic, 2022–Present", "Staff Psychologist, Fountain House Lahore, 2019–2022", "Associate Psychologist, Punjab Institute of Mental Health, 2018–2019"];
const services = ["Individual Therapy", "Couples Counselling", "Anxiety & Stress Management", "Online Sessions"];

// Only the fields that are still empty are filled; anything already written is left alone.
const profileSql = `
UPDATE practitioners SET
  services = CASE WHEN services IN ('[]', '') THEN ${q(JSON.stringify(services))} ELSE services END,
  education = CASE WHEN education IN ('[]', '') THEN ${q(JSON.stringify(education))} ELSE education END,
  work_experience = CASE WHEN work_experience IS NULL OR work_experience IN ('[]', '') THEN ${q(JSON.stringify(experience))} ELSE work_experience END,
  website_url = COALESCE(NULLIF(website_url, ''), 'https://example.com/sample-practice')
WHERE id = ${q(practitioner.id)};`;

const timeOffSql = `
INSERT INTO time_off (practitioner_slug, start_date, end_date, label) VALUES (${q(slug)}, ${q(addDays(now.date, 20))}, ${q(addDays(now.date, 22))}, 'Conference (sample)');`;

const sql = values.remove ? removeSql : [removeSql, profileSql, appointmentSql, visitSql.join("\n"), timeOffSql].join("\n");

const dir = mkdtempSync(join(tmpdir(), "mentifylabs-dummy-"));
const file = join(dir, "dummy.sql");
writeFileSync(file, sql);
const result = wrangler(["--file", file]);
rmSync(dir, { recursive: true, force: true });
if (!result.ok) fail(`Could not write the data:\n${result.out.slice(-1500)}`);

const count = (table: string, where: string) => {
  const r = wrangler(["--json", "--command", `SELECT count(*) AS n FROM ${table} WHERE practitioner_slug = ${q(slug)} AND ${where}`]);
  try {
    return JSON.parse(r.out.slice(r.out.indexOf("[")))[0].results[0].n as number;
  } catch {
    return "?";
  }
};
console.log(
  `${values.remove ? "Removed the sample data from" : "Added sample data to"} ${email} (${slug}), local database only:\n` +
    `  appointments: ${count("appointments", `client_contact LIKE ${q(PHONE_TAG)}`)}\n` +
    `  profile visits: ${count("profile_views", "visitor LIKE 'demo-%'")}\n` +
    `  time off: ${count("time_off", "label = 'Conference (sample)'")}`,
);
