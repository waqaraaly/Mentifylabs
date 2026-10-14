/** The periods the Reports page can cover: a number of days, or everything so far. */
export const REPORT_RANGES = [30, 90, 180, 365, "all"] as const;
export type ReportRange = (typeof REPORT_RANGES)[number];

/** Never look back further than this, however old the platform is, so a daily list stays a sensible size. */
export const ALL_TIME_MAX_DAYS = 3650;
