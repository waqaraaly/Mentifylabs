// Kept apart from src/data/profileStats.ts (which pulls in server-only code) so client components can import it.
export const STATS_RANGES = [7, 30, 90] as const;
export type StatsRange = (typeof STATS_RANGES)[number];

/** A number of days, or everything since the practitioner's first view or sign-up. */
export type StatsPeriod = StatsRange | "all";

/** However old the profile is, "all time" never looks back further than this, so the chart stays a sensible size. */
export const ALL_TIME_MAX_DAYS = 3650;
