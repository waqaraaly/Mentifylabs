import { getAllPractitioners } from "@/data/practitioners";
import { getAllAppointments } from "@/data/appointments";
import { getReviewTimeline } from "@/data/reviewEvents";
import { getPlatformStats } from "@/data/profileStats";
import { buildReport, type Report } from "@/lib/reportMetrics";
import { ALL_TIME_MAX_DAYS, type ReportRange } from "@/lib/reportRanges";

const DAY = 24 * 60 * 60 * 1000;

/** Everything the Reports page shows, for the last `range` days, or for everything so far. */
export async function getReport(range: ReportRange): Promise<Report> {
  const [practitioners, appointments, events] = await Promise.all([getAllPractitioners(), getAllAppointments(), getReviewTimeline()]);
  const now = Date.now();
  const allTime = range === "all";
  // "All time" starts on the day of the earliest practitioner or appointment (at least a month, so the numbers have some width).
  const earliest = Math.min(
    now,
    ...practitioners.map((p) => Date.parse(p.dateJoined)).filter((t) => !Number.isNaN(t)),
    ...appointments.map((a) => Date.parse(a.createdAt)).filter((t) => !Number.isNaN(t)),
  );
  const days = allTime ? Math.min(ALL_TIME_MAX_DAYS, Math.max(30, Math.floor((now - earliest) / DAY) + 1)) : range;
  const platform = await getPlatformStats(days);
  return buildReport({
    practitioners,
    appointments,
    events,
    nowMs: now,
    range: days,
    allTime,
    visitors: platform.visitors,
    requests: platform.bookingRequests,
    practitionerVisitors: platform.rows.map((r) => ({ slug: r.slug, visitors: r.visitors })),
  });
}
