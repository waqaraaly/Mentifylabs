import type { Practitioner } from "@/types/practitioner";
import type { Appointment } from "@/types/appointment";
import { headlineKey, headlineLabel, isLive, type HeadlineKey } from "@/lib/practitionerState";
import { isAwaitingApproval } from "@/lib/verification";

/**
 * The numbers on the Reports page, worked out in one place from plain data so they can be tested.
 * Everything is real: nothing here is estimated or filled in.
 */

const DAY = 24 * 60 * 60 * 1000;

export interface ReviewEventRow {
  slug: string;
  kind: "verification_submitted" | "verification_approved" | "verification_rejected";
  /** ISO timestamp. */
  at: string;
}

export interface ReportInput {
  practitioners: Practitioner[];
  appointments: Appointment[];
  events: ReviewEventRow[];
  /** Now, in milliseconds. */
  nowMs: number;
  /** The period the report covers, in days. */
  range: number;
  /** True when the period is "everything so far" (`range` is then just how far back that goes). */
  allTime?: boolean;
  /** Profile visitors and appointment requests across the platform in the period. */
  visitors: number;
  requests: number;
  /** Visitors to each practitioner's profile in the period. Anyone missing had none. */
  practitionerVisitors?: { slug: string; visitors: number }[];
}

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
}

export interface PersonRow {
  slug: string;
  name: string;
  title: string;
  /** The right-hand note for this row. */
  note: string;
}

export interface ShareRow {
  slug: string;
  name: string;
  title: string;
  count: number;
  /** Percent of all appointments in the period. */
  share: number;
}

export interface Report {
  range: number;
  /** The report covers everything so far rather than a fixed number of days. */
  allTime: boolean;
  totals: { practitioners: number; live: number };
  funnel: { cohort: number; stages: FunnelStage[] };
  review: {
    waiting: number;
    oldestWaitDays: number | null;
    averageDaysToApprove: number | null;
    approved: number;
    sentBack: number;
  };
  conversion: { visitors: number; requests: number; rate: number | null };
  concentration: { total: number; top: ShareRow[]; top3Share: number | null };
  /** The ten practitioners whose profiles had the most visitors in the period, most first. */
  mostVisited: PersonRow[];
  /** Twelve months, oldest first: how many joined that month, and how many practitioners there were by its end. */
  growth: { m: string; joined: number; total: number }[];
  dormant: PersonRow[];
  liveNoAppointments: PersonRow[];
  /** Active accounts that have not sent their credentials in yet. */
  notSubmitted: PersonRow[];
  /** Credentials sent back, waiting for the practitioner to submit again. */
  sentBack: PersonRow[];
  /** Verified, but the practitioner has not published the profile. */
  verifiedNotLive: PersonRow[];
  /** Signed up or invited but not able to sign in yet: email unconfirmed, or invite not used. */
  cannotSignIn: PersonRow[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const person = (p: Practitioner, note: string): PersonRow => ({ slug: p.slug, name: p.fullName, title: p.professionalTitle, note });

export function buildReport(input: ReportInput): Report {
  const { practitioners, appointments, events, nowMs, range, allTime = false, visitors, requests, practitionerVisitors = [] } = input;
  const cutoffDay = isoDay(nowMs - (range - 1) * DAY);
  const cutoffMs = nowMs - range * DAY;

  const live = practitioners.filter(isLive);
  const hasAppointment = new Set(appointments.map((a) => a.practitionerSlug));

  // ---- Onboarding funnel: people who signed up in the period, and how far each step carries them ----
  const submitted = new Set(events.filter((e) => e.kind === "verification_submitted").map((e) => e.slug));
  const steps: { key: string; label: string; passes: (p: Practitioner) => boolean }[] = [
    { key: "signed_up", label: "Signed up", passes: () => true },
    { key: "confirmed", label: "Confirmed their email", passes: (p) => p.hasLogin !== false && !p.emailUnconfirmed },
    { key: "submitted", label: "Submitted credentials", passes: (p) => submitted.has(p.slug) || p.verificationStatus !== "unverified" || !!p.verificationNote },
    { key: "verified", label: "Verified", passes: (p) => p.verificationStatus === "verified" },
    { key: "live", label: "Went live", passes: (p) => isLive(p) },
    { key: "first_appointment", label: "Received an appointment", passes: (p) => hasAppointment.has(p.slug) },
  ];
  let carried = practitioners.filter((p) => p.dateJoined >= cutoffDay);
  const cohort = carried.length;
  const stages: FunnelStage[] = steps.map((step) => {
    carried = carried.filter(step.passes); // each step only counts people who made it through the one before
    return { key: step.key, label: step.label, count: carried.length };
  });

  // ---- Review queue: how long people wait, and how long a decision takes ----
  const waitingNow = practitioners.filter(isAwaitingApproval);
  const waits = waitingNow
    .map((p) => (p.verificationSubmittedAt ? (nowMs - Date.parse(p.verificationSubmittedAt)) / DAY : null))
    .filter((d): d is number => d !== null && Number.isFinite(d));

  const bySlug = new Map<string, ReviewEventRow[]>();
  for (const e of events) bySlug.set(e.slug, [...(bySlug.get(e.slug) ?? []), e]);
  const approvalDays: number[] = [];
  let approved = 0;
  let sentBack = 0;
  for (const list of bySlug.values()) {
    let lastSubmitted: number | null = null;
    for (const e of [...list].sort((a, b) => a.at.localeCompare(b.at))) {
      const at = Date.parse(e.at);
      if (e.kind === "verification_submitted") lastSubmitted = at;
      else if (at >= cutoffMs) {
        if (e.kind === "verification_approved") {
          approved++;
          if (lastSubmitted !== null) approvalDays.push((at - lastSubmitted) / DAY);
        } else sentBack++;
      }
      if (e.kind !== "verification_submitted") lastSubmitted = null;
    }
  }

  // ---- Appointments in the period: how concentrated they are ----
  const inPeriod = appointments.filter((a) => a.createdAt.slice(0, 10) >= cutoffDay);
  const perPractitioner = new Map<string, number>();
  for (const a of inPeriod) perPractitioner.set(a.practitionerSlug, (perPractitioner.get(a.practitionerSlug) ?? 0) + 1);
  const byId = new Map(practitioners.map((p) => [p.slug, p]));
  const ranked = [...perPractitioner.entries()]
    .map(([slug, count]) => ({ slug, count, p: byId.get(slug) }))
    .filter((r): r is { slug: string; count: number; p: Practitioner } => !!r.p)
    .sort((a, b) => b.count - a.count || a.p.fullName.localeCompare(b.p.fullName));
  const total = inPeriod.length;
  const top: ShareRow[] = ranked.slice(0, 10).map((r) => ({
    slug: r.slug, name: r.p.fullName, title: r.p.professionalTitle, count: r.count, share: total ? Math.round((r.count / total) * 100) : 0,
  }));
  const top3 = ranked.slice(0, 3).reduce((sum, r) => sum + r.count, 0);

  // ---- Most visited profiles ----
  const practitionerBySlug = new Map(practitioners.map((p) => [p.slug, p]));
  const mostVisited = practitionerVisitors
    .filter((v) => v.visitors > 0 && practitionerBySlug.has(v.slug))
    .sort((a, b) => b.visitors - a.visitors || practitionerBySlug.get(a.slug)!.fullName.localeCompare(practitionerBySlug.get(b.slug)!.fullName))
    .slice(0, 10)
    .map((v) => person(practitionerBySlug.get(v.slug)!, `${v.visitors} ${v.visitors === 1 ? "visitor" : "visitors"}`));

  // ---- Growth: how many practitioners there were at the end of each of the last twelve months ----
  const now = new Date(nowMs);
  const growth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    // dateJoined is YYYY-MM-DD, so comparing its first seven characters orders by month.
    return {
      m: MONTHS[d.getUTCMonth()],
      joined: practitioners.filter((p) => p.dateJoined.slice(0, 7) === key).length,
      total: practitioners.filter((p) => p.dateJoined.slice(0, 7) <= key).length,
    };
  });

  // ---- Lists that point at someone to look at ----
  // Gone quiet: a live practitioner whose last sign-in was more than 30 days ago. Appointments don't count, only the practitioner coming back.
  // Someone with no recorded sign-in (older accounts) is measured from the day they joined.
  const monthAgo = nowMs - 30 * DAY;
  const dormant = live
    .map((p) => {
      const since = p.lastSignIn ?? `${p.dateJoined}T00:00:00.000Z`;
      return { p, quiet: Date.parse(since) < monthAgo, days: Math.floor((nowMs - Date.parse(since)) / DAY) };
    })
    .filter((x) => x.quiet)
    .sort((a, b) => b.days - a.days)
    .map((x) => person(x.p, x.p.lastSignIn ? `Last signed in ${x.days} days ago` : "No sign-in recorded"));

  const liveNoAppointments = live.filter((p) => !hasAppointment.has(p.slug)).map((p) => person(p, "None yet"));

  // Everyone below is an active account that is not live, split by the one step they are waiting on (the headline status).
  const lastSentBack = new Map<string, string>();
  for (const e of events) {
    if (e.kind === "verification_rejected" && e.at > (lastSentBack.get(e.slug) ?? "")) lastSentBack.set(e.slug, e.at);
  }
  const daysAgo = (iso: string) => Math.max(0, Math.floor((nowMs - Date.parse(iso)) / DAY));
  const ago = (d: number) => (d === 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`);
  const inState = (...keys: HeadlineKey[]) => practitioners.filter((p) => keys.includes(headlineKey(p)));

  const notSubmitted = inState("not_verified").map((p) => person(p, `Joined ${ago(daysAgo(`${p.dateJoined}T00:00:00.000Z`))}`));
  const sentBackList = inState("verification_rejected").map((p) => {
    const at = lastSentBack.get(p.slug);
    return person(p, at ? `Sent back ${ago(daysAgo(at))}` : "Sent back");
  });
  const verifiedNotLive = inState("verified_not_live").map((p) => person(p, "Not published"));
  const cannotSignIn = inState("email_not_confirmed", "invite_sent", "invite_not_sent").map((p) => person(p, headlineLabel(headlineKey(p))));

  const approvedAverage = approvalDays.length ? approvalDays.reduce((a, b) => a + b, 0) / approvalDays.length : null;

  return {
    range,
    allTime,
    totals: { practitioners: practitioners.length, live: live.length },
    funnel: { cohort, stages },
    review: {
      waiting: waitingNow.length,
      oldestWaitDays: waits.length ? Math.max(...waits) : null,
      averageDaysToApprove: approvedAverage,
      approved,
      sentBack,
    },
    conversion: { visitors, requests, rate: visitors > 0 ? (requests / visitors) * 100 : null },
    concentration: { total, top, top3Share: total ? Math.round((top3 / total) * 100) : null },
    mostVisited,
    growth,
    dormant,
    liveNoAppointments,
    notSubmitted,
    sentBack: sentBackList,
    verifiedNotLive,
    cannotSignIn,
  };
}
