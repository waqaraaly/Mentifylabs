"use client";

import { BOOKING_MODAL_ID } from "@/components/practitioner/BookingModal";
import { formatDate, formatTime12h } from "@/lib/format";
import { useInBrowser } from "@/lib/useInBrowser";
import { useViewerTimeZone } from "@/lib/useViewerTimeZone";
import { displayZoneFor, notStarted, shownIn, type ShownTimes } from "@/lib/viewerTime";
import type { Slot } from "@/types/slot";

function openBooking() {
  (document.getElementById(BOOKING_MODAL_ID) as HTMLDialogElement | null)?.showModal();
}

type Variant = "days" | "chips" | "line";

/**
 * The practitioner's real open times, the way booking sites lead with them: a few days with their times, a short list
 * of the soonest times, or one line naming the next one. Online times are shown on the visitor's clock and in-person
 * times on the practitioner's, as in the booking window. Pressing a time opens that window. The page may be a saved
 * copy up to an hour old, so the browser filters out times that have started; until then it shows what the server sent.
 */
export function Availability({
  slots,
  zone,
  accepting,
  preview,
  variant = "days",
  hideEmpty = false,
  className = "",
}: {
  slots: Slot[];
  zone: string;
  accepting: boolean;
  preview: boolean;
  variant?: Variant;
  /** Draw nothing, instead of a sentence, when there is no time to show. */
  hideEmpty?: boolean;
  className?: string;
}) {
  const inBrowser = useInBrowser();
  const viewer = useViewerTimeZone(zone);

  if (!accepting) {
    if (hideEmpty) return null;
    return <p className={`text-sm text-(--pt-muted) ${className}`}>Not taking new bookings right now.</p>;
  }

  const open = (inBrowser ? notStarted(slots, zone) : slots).slice().sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const shown: ShownTimes[] = open.map((s) => shownIn(s, zone, displayZoneFor(s.sessionType, zone, viewer.zone)));

  if (shown.length === 0) {
    if (hideEmpty) return null;
    return <p className={`text-sm leading-snug text-(--pt-muted) ${className}`}>No open times right now. Check back soon, or get in touch.</p>;
  }

  const timeButton =
    "cursor-pointer rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-(--pt-accent-text) shadow-[inset_0_0_0_1.5px_var(--pt-accent)] transition hover:bg-(--pt-accent) hover:text-(--pt-accent-foreground) disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-(--pt-accent-text)";

  if (variant === "line") {
    const next = shown[0];
    return (
      <p className={`flex items-center gap-2 text-sm ${className}`}>
        <span className="text-(--pt-muted)">Next available</span>
        <span className="font-semibold">
          {formatDate(next.date)}, {formatTime12h(next.startTime)} {next.tag}
        </span>
      </p>
    );
  }

  if (variant === "chips") {
    return (
      <div className={className}>
        <div className="flex flex-wrap gap-2">
          {shown.slice(0, 4).map((s, i) => (
            <button key={i} type="button" disabled={preview} onClick={openBooking} className={timeButton}>
              <span className="text-(--pt-muted)">{formatDate(s.date).replace(/,.*/, "")}</span> {formatTime12h(s.startTime)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-(--pt-muted)">Times in {shown[0].tag}</p>
      </div>
    );
  }

  const days = new Map<string, ShownTimes[]>();
  for (const s of shown) days.set(s.date, [...(days.get(s.date) ?? []), s]);
  const columns = [...days.entries()].slice(0, 3);

  return (
    <div className={className}>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map(([date, times]) => (
          <div key={date} className="min-w-0 text-center">
            <p className="text-xs font-semibold">{formatDate(date).split(",")[0]}</p>
            <p className="mb-2 text-xs text-(--pt-muted)">{formatDate(date).split(", ")[1]}</p>
            <div className="grid gap-1.5">
              {times.slice(0, 4).map((s, i) => (
                <button key={i} type="button" disabled={preview} onClick={openBooking} className={`${timeButton} !px-1 text-center`}>
                  {formatTime12h(s.startTime).replace(" ", " ")}
                </button>
              ))}
              {times.length > 4 && (
                <button type="button" disabled={preview} onClick={openBooking} className="cursor-pointer text-xs font-medium text-(--pt-accent-text) underline underline-offset-2 disabled:cursor-default">
                  +{times.length - 4} more
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-(--pt-muted)">Times shown in {shown[0].tag}</p>
    </div>
  );
}
