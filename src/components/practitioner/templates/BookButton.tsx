"use client";

import type { ReactNode } from "react";
import { BOOKING_MODAL_ID } from "@/components/practitioner/BookingModal";

const VARIANT = {
  solid: "bg-(--pt-accent) text-(--pt-accent-foreground) hover:bg-(--pt-accent-hover)",
  outline: "text-(--pt-text) shadow-[inset_0_0_0_1.5px_var(--pt-text)] hover:bg-(--pt-text) hover:text-(--pt-bg)",
  // For sitting on a coloured panel: the panel's own text colour as the fill.
  inverse: "bg-(--pt-tone-foreground) text-(--pt-tone) hover:opacity-90",
} as const;

/**
 * "Book a session" for the template pages: opens the same booking dialog as the floating bar. In the private preview it
 * is shown but cannot be pressed, and while the practitioner is not taking bookings it says so instead.
 */
export function BookButton({
  accepting,
  variant = "solid",
  className = "",
  children = "Book a session",
}: {
  accepting: boolean;
  /** Accepted so every call site reads the same; in the preview the button opens a notice instead of the booking window. */
  preview?: boolean;
  variant?: keyof typeof VARIANT;
  className?: string;
  children?: ReactNode;
}) {
  if (!accepting) {
    return <span className={`inline-flex items-center rounded-(--pt-btn,0.75rem) px-5 py-3 text-sm text-(--pt-muted) shadow-[inset_0_0_0_1px_var(--pt-border)] ${className}`}>Not taking new bookings right now</span>;
  }

  return (
    <button
      type="button"
      onClick={() => (document.getElementById(BOOKING_MODAL_ID) as HTMLDialogElement | null)?.showModal()}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-(--pt-btn,0.75rem) px-6 py-3.5 text-[15px] font-semibold whitespace-nowrap transition duration-200 disabled:cursor-default ${VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
