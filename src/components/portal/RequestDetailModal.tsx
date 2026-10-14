"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, X } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Slot } from "@/types/slot";
import { formatDateFull, formatRequestedAt, formatTime12h } from "@/lib/format";
import { approveAppointment, declineAppointment, rescheduleAppointmentAction } from "@/app/dashboard/sessions/actions";
import { RescheduleFields } from "./RescheduleFields";

export function RequestDetailModal({
  appointment,
  slotPassed,
  initialView = "details",
  practitionerSlug,
  openSlots,
  onClose,
}: {
  appointment: Appointment;
  /** The requested time has already gone by, so it can only be moved or declined, not accepted as it stands. */
  slotPassed: boolean;
  /** Which screen the modal opens on; the table opens a passed request straight on rescheduling. */
  initialView?: "details" | "reschedule";
  practitionerSlug: string;
  openSlots: Slot[];
  onClose: () => void;
}) {
  const isOnline = appointment.sessionType === "online";
  const [view, setView] = useState<"details" | "reschedule">(initialView);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submitReschedule = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await rescheduleAppointmentAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setView("details");
      router.refresh();
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface shadow-2xl ring-1 ring-black/[0.06]">
        {view === "details" ? (
          <>
            <div className="flex items-start justify-between gap-4 px-8 pt-8">
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight">{appointment.clientName}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-black/[0.05] hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div className="px-8">
              <div className="mt-6 divide-y divide-black/[0.08] overflow-hidden rounded-xl ring-1 ring-black/[0.08]">
                <a
                  href={`tel:${appointment.clientContact}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-black/[0.02]"
                >
                  <span className="text-xs font-medium tracking-[0.06em] text-muted uppercase">Contact</span>
                  <span className="text-sm font-semibold">
                    {appointment.clientContact}
                  </span>
                </a>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-xs font-medium tracking-[0.06em] text-muted uppercase">Date</span>
                  <span className="text-right text-base font-semibold">
                    {formatDateFull(appointment.date)}
                    {slotPassed && (
                      <span className="mt-1 block text-xs font-normal text-alert">
                        This time has already passed. Reschedule it or decline.
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-xs font-medium tracking-[0.06em] text-muted uppercase">Time</span>
                  <span className="text-base font-semibold">
                    {formatTime12h(appointment.startTime)} – {formatTime12h(appointment.endTime)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-xs font-medium tracking-[0.06em] text-muted uppercase">Session mode</span>
                  <span className="text-sm font-semibold">{isOnline ? "Online" : "On-Site"}</span>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-xs font-medium tracking-[0.06em] text-muted uppercase">Received</span>
                  <span className="text-sm text-muted" suppressHydrationWarning>
                    {formatRequestedAt(appointment.createdAt)}
                  </span>
                </div>
              </div>

              <div className="mt-7">
                <p className="text-sm font-semibold">Client&apos;s message</p>
                {appointment.concern ? (
                  <p className="mt-2.5 border-l-2 border-black/[0.12] pl-4 text-base leading-relaxed text-foreground/85">
                    {appointment.concern}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted">No message was included with this request.</p>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-black/[0.06] px-8 py-6">
              <button
                type="button"
                onClick={() => setView("reschedule")}
                className={
                  slotPassed
                    ? "order-last ml-auto rounded-lg bg-accent-strong px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                    : "rounded-lg px-6 py-3 text-sm font-medium text-muted ring-1 ring-black/[0.08] transition hover:bg-black/[0.03] hover:text-foreground"
                }
              >
                Reschedule
              </button>
              <form className={slotPassed ? "flex flex-wrap items-center gap-3" : "ml-auto flex flex-wrap items-center gap-3"}>
                <input type="hidden" name="id" value={appointment.id} />
                <input type="hidden" name="slug" value={practitionerSlug} />
                <button
                  type="submit"
                  formAction={declineAppointment}
                  className="rounded-lg px-6 py-3 text-sm font-medium text-muted ring-1 ring-black/[0.08] transition hover:bg-alert/[0.06] hover:text-alert"
                >
                  Decline
                </button>
                {!slotPassed && (
                  <button
                    type="submit"
                    formAction={approveAppointment}
                    className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    Approve
                  </button>
                )}
              </form>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 px-8 pt-8">
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.1] text-primary">
                  <CalendarClock className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Reschedule appointment</h2>
                  <p className="mt-0.5 text-sm text-muted">For {appointment.clientName}&apos;s request</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-black/[0.05] hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <form onSubmit={submitReschedule} className="mt-6 px-8">
              <input type="hidden" name="id" value={appointment.id} />
              <input type="hidden" name="slug" value={practitionerSlug} />

              <RescheduleFields openSlots={openSlots} />

              {error && (
            <p role="alert" className="mt-5 text-sm font-medium text-alert">
              {error}
            </p>
          )}

              <div className="mt-7 flex items-center justify-end gap-3 border-t border-black/[0.06] py-6">
                <button
                  type="button"
                  onClick={() => setView("details")}
                  className="rounded-lg px-5 py-2.5 text-sm font-medium text-muted ring-1 ring-black/[0.08] transition hover:bg-black/[0.04]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "Rescheduling…" : "Reschedule"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  );
}
