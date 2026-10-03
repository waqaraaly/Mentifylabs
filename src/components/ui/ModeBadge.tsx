import type { BookedSessionType } from "@/lib/sessionType";

/**
 * The pill that says whether a session is Online or On-Site. Online is amber and On-Site is the brand green, and
 * the Super Admin portal uses the same pairing (see `online` and `onsite` in its status colours), so a mode looks
 * the same wherever it is shown as a badge.
 */
export function ModeBadge({ mode }: { mode: BookedSessionType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${
        mode === "online" ? "bg-amber-500/[0.16] text-amber-800 dark:text-amber-300" : "bg-primary/10 text-primary"
      }`}
    >
      {mode === "online" ? "Online" : "On-Site"}
    </span>
  );
}
