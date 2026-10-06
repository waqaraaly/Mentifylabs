import { getAllPractitioners } from "@/data/practitioners";
import { getAllAppointments } from "@/data/appointments";
import { getReviewTimeline } from "@/data/reviewEvents";
import { getPlatformStats } from "@/data/profileStats";
import { buildReport, type Report } from "@/lib/reportMetrics";

/** Everything the Reports page shows, for the last `range` days. */
export async function getReport(range: number): Promise<Report> {
  const [practitioners, appointments, events, platform] = await Promise.all([
    getAllPractitioners(),
    getAllAppointments(),
    getReviewTimeline(),
    getPlatformStats(range),
  ]);
  return buildReport({
    practitioners,
    appointments,
    events,
    nowMs: Date.now(),
    range,
    visitors: platform.visitors,
    requests: platform.bookingRequests,
  });
}
