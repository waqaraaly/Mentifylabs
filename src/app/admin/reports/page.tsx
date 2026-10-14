import { requireAdmin } from "@/lib/session";
import { getReport } from "@/data/reports";
import { REPORT_RANGES, type ReportRange } from "@/lib/reportRanges";
import { ReportsView } from "@/components/admin/ReportsView";

export const metadata = { title: "Reports" };

function parseRange(value: string | string[] | undefined): ReportRange {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "all") return "all";
  const n = Number(raw);
  return (REPORT_RANGES as readonly (number | string)[]).includes(n) ? (n as ReportRange) : 30;
}

export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireAdmin();
  const range = parseRange((await searchParams).range);
  return <ReportsView report={await getReport(range)} />;
}
