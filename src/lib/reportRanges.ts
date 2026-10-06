/** The periods the Reports page can cover, in days. */
export const REPORT_RANGES = [30, 90, 365] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];
