"use client";

import { useRef } from "react";
import { CalendarClock, X } from "lucide-react";
import { BOOKING_MODAL_ID } from "@/components/practitioner/BookingModal";

/**
 * Stands in for the booking window in the owner's private preview, so "Book a session" does something there. It opens
 * from the same buttons as the real window but cannot take a booking.
 */
export function PreviewBookingNotice() {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <dialog
      id={BOOKING_MODAL_ID}
      ref={ref}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
      className="m-auto w-[calc(100%-1.25rem)] max-w-md overflow-hidden rounded-[24px] border-0 bg-(--pt-bg) p-0 text-(--pt-text) shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm sm:w-full"
    >
      <div className="relative px-6 py-9 text-center sm:px-10 sm:py-11">
        <button type="button" onClick={close} aria-label="Close" className="absolute top-4 right-4 rounded-full p-1.5 text-(--pt-muted) transition hover:bg-black/5 hover:text-(--pt-text)">
          <X className="size-6" aria-hidden />
        </button>
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-(--pt-tint-strong) text-(--pt-accent-text)">
          <CalendarClock className="size-7" aria-hidden />
        </span>
        <h3 className="mt-5 text-2xl leading-tight font-semibold tracking-tight">This is where clients book</h3>
        <p className="mt-3 text-base leading-relaxed text-(--pt-muted)">
          On your published profile this opens your booking window: clients choose how to meet, a day and a time, and send you a request. Nothing can be booked from the private preview.
        </p>
        <button
          type="button"
          onClick={close}
          className="mt-6 inline-flex items-center justify-center rounded-(--pt-btn,0.75rem) bg-(--pt-accent) px-8 py-3 text-base font-semibold text-(--pt-accent-foreground) transition hover:bg-(--pt-accent-hover)"
        >
          Close
        </button>
      </div>
    </dialog>
  );
}
