"use client";

import { useState, useTransition } from "react";
import { setAcceptingBookingsAction } from "@/app/dashboard/profile/actions";

/**
 * State for the "accepting new bookings" switch. Saves immediately; if saving fails the switch snaps back,
 * so what's shown always matches what clients see. Shared by the switch and its error message.
 */
export function useAcceptingBookings(initial: boolean) {
  const [accepting, setAccepting] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function toggle() {
    const next = !accepting;
    setAccepting(next);
    setFailed(false);
    startTransition(async () => {
      try {
        await setAcceptingBookingsAction(next);
      } catch {
        setAccepting(!next);
        setFailed(true);
      }
    });
  }

  return { accepting, pending, failed, toggle };
}

type BookingsState = ReturnType<typeof useAcceptingBookings>;

/** Compact switch for a page header's action row. */
export function AcceptingBookingsSwitch({ accepting, pending, toggle }: BookingsState) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={accepting}
      disabled={pending}
      onClick={toggle}
      title={
        accepting
          ? "Clients can request sessions from your public profile. Click to pause new bookings."
          : "New bookings are paused. Click to let clients book you again."
      }
      className="inline-flex items-center gap-3 rounded-lg bg-surface py-2 pr-3 pl-4 text-sm font-semibold ring-1 ring-border transition hover:bg-foreground/[0.05] disabled:opacity-60"
    >
      <span className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${accepting ? "bg-primary" : "bg-muted"}`} aria-hidden />
        {accepting ? "Accepting bookings" : "Bookings paused"}
      </span>
      <span
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition ${
          accepting ? "bg-primary" : "bg-black/[0.2]"
        }`}
        aria-hidden
      >
        <span
          className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
            accepting ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

/** Shown only while bookings are paused (or a save failed), so the state is never easy to forget. */

/** Shown only when saving the switch failed. The switch itself already says when bookings are paused. */
export function BookingsError({ failed }: BookingsState) {
  if (!failed) return null;
  return (
    <p role="alert" className="rounded-xl bg-alert/[0.07] px-5 py-3 text-sm font-medium text-alert ring-1 ring-alert/20">
      Couldn&apos;t save that change. Please try again.
    </p>
  );
}
