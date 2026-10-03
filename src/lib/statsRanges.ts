// Kept apart from src/data/profileStats.ts (which pulls in server-only code) so client components can import it.
export const STATS_RANGES = [7, 30, 90] as const;
export type StatsRange = (typeof STATS_RANGES)[number];
