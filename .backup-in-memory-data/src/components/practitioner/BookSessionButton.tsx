"use client";

import { BOOKING_MODAL_ID } from "@/components/practitioner/BookingModal";

// The "Book a Session" button for the top bar: opens the same booking modal as
// the floating bar at the bottom, so there's one action wherever the visitor is.
export function BookSessionButton() {
  function openModal() {
    const dialog = document.getElementById(BOOKING_MODAL_ID) as HTMLDialogElement | null;
    dialog?.showModal();
  }

  return (
    <button
      type="button"
      onClick={openModal}
      className="shrink-0 rounded-full bg-(--pt-accent) px-6 py-2.5 text-[15px] font-semibold whitespace-nowrap text-(--pt-accent-foreground) transition hover:bg-(--pt-accent-hover)"
    >
      Book a Session
    </button>
  );
}
