"use client";

import { BOOKING_MODAL_ID } from "@/components/practitioner/BookingModal";
import { formatDate } from "@/lib/format";
import { useInBrowser } from "@/lib/useInBrowser";
import { useViewerTimeZone } from "@/lib/useViewerTimeZone";
import { displayZoneFor, nextAvailable, shownIn } from "@/lib/viewerTime";
import type { Slot } from "@/types/slot";

// A floating pill fixed to the bottom of the viewport — next-available time
// plus the booking CTA travel with the visitor instead of living inside a
// section further up the page. Colors and the pulsing dot match the
// reference design exactly.
export function StickyBookingBar({
  slots,
  practitionerZone,
  accepting = true,
}: {
  slots: Slot[];
  practitionerZone: string;
  accepting?: boolean;
}) {
  const inBrowser = useInBrowser();
  const viewer = useViewerTimeZone(practitionerZone);
  // The earliest slot that hasn't started, on the practitioner's clock. The page can be a copy up to an hour old, so the
  // browser checks again; until then it shows exactly what the server sent.
  const nextSlot = inBrowser
    ? nextAvailable(slots, practitionerZone)
    : ([...slots].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0] ?? null);
  // Shown on the visitor's clock for an online slot, and on the practitioner's for one in person.
  const shown = nextSlot ? shownIn(nextSlot, practitionerZone, displayZoneFor(nextSlot.sessionType, practitionerZone, viewer.zone)) : null;

  function openModal() {
    const dialog = document.getElementById(BOOKING_MODAL_ID) as HTMLDialogElement | null;
    dialog?.showModal();
  }

  if (!accepting) {
    return (
      <div className="fixed bottom-8 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full border border-(--pt-border) bg-white px-6 py-3.5 text-center text-[13px] text-(--pt-muted) shadow-[0_20px_48px_-16px_rgba(32,34,31,0.32)] sm:w-auto">
        Not taking new bookings right now
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 items-center justify-between gap-3 rounded-full border border-(--pt-border) bg-white py-2.5 pr-2.5 pl-5 shadow-[0_20px_48px_-16px_rgba(32,34,31,0.32)] transition hover:-translate-y-0.5 sm:w-auto sm:gap-6 sm:pl-8">
      {/* Two quiet lines that wrap, so the date and time are never cut off. */}
      {shown ? (
        <span className="flex min-w-0 flex-col gap-0.5 leading-snug">
          <span className="text-xs text-(--pt-muted)">Next available</span>
          <span className="text-sm font-semibold text-(--pt-text) sm:text-[15px]">
            {/* The weekday is left out on a narrow screen, so the date and time fit on fewer lines. */}
            <span className="hidden sm:inline">{formatDate(shown.date)}</span>
            <span className="sm:hidden">{formatDate(shown.date).replace(/^[A-Za-z]+,\s*/, "")}</span>, {shown.startTime} {shown.tag}
          </span>
        </span>
      ) : (
        <span className="text-[13px] leading-snug text-(--pt-muted)">Reach out to check availability</span>
      )}
      <button
        type="button"
        onClick={openModal}
        className="shrink-0 rounded-full bg-(--pt-accent) px-4 py-3 text-sm font-semibold whitespace-nowrap text-(--pt-accent-foreground) sm:px-6 sm:py-3.5 sm:text-[15px] transition hover:bg-(--pt-accent-hover)"
      >
        Book a Session
      </button>
    </div>
  );
}
