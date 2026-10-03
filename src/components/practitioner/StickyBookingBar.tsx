"use client";

import { BOOKING_MODAL_ID } from "@/components/practitioner/BookingModal";
import { formatDate } from "@/lib/format";
import type { Slot } from "@/types/slot";

// A floating pill fixed to the bottom of the viewport — next-available time
// plus the booking CTA travel with the visitor instead of living inside a
// section further up the page. Colors and the pulsing dot match the
// reference design exactly.
export function StickyBookingBar({ nextSlot, accepting = true }: { nextSlot: Slot | null; accepting?: boolean }) {
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
    <div className="fixed bottom-8 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-4 rounded-full border border-(--pt-border) bg-white py-2 pr-2 pl-6 shadow-[0_20px_48px_-16px_rgba(32,34,31,0.32)] transition hover:-translate-y-0.5 sm:w-auto">
      <span className="flex min-w-0 items-center gap-2.5 text-[13px] text-(--pt-muted)">
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inset-0 animate-ping rounded-full bg-(--pt-accent) opacity-50" />
          <span className="relative size-2 rounded-full bg-(--pt-accent)" />
        </span>
        <span className="truncate">
          {nextSlot ? (
            <>
              Next available{" "}
              <span className="font-semibold text-(--pt-text)">
                {formatDate(nextSlot.date)}, {nextSlot.startTime}
              </span>
            </>
          ) : (
            "Reach out to check availability"
          )}
        </span>
      </span>
      <span className="h-6 w-px shrink-0 bg-(--pt-border)" aria-hidden />
      <button
        type="button"
        onClick={openModal}
        className="shrink-0 rounded-full bg-(--pt-accent) px-7 py-3.5 text-[15px] font-semibold whitespace-nowrap text-(--pt-accent-foreground) transition hover:bg-(--pt-accent-hover)"
      >
        Book a Session
      </button>
    </div>
  );
}
