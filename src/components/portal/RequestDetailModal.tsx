"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Phone, X } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Slot } from "@/types/slot";
import { formatDateFull } from "@/lib/format";
import { approveAppointment, declineAppointment, rescheduleAppointmentAction } from "@/app/dashboard/sessions/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RescheduleFields } from "./RescheduleFields";

export function RequestDetailModal({
  appointment,
  practitionerSlug,
  openSlots,
  onClose,
}: {
  appointment: Appointment;
  practitionerSlug: string;
  openSlots: Slot[];
  onClose: () => void;
}) {
  const isOnline = appointment.sessionType === "online";
  const [view, setView] = useState<"details" | "reschedule">("details");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submitReschedule = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await rescheduleAppointmentAction(formData);
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
                <div className="mt-2">
                  <StatusBadge status={appointment.status} />
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

            <div className="px-8">
              <div className="mt-6 divide-y divide-black/[0.08] overflow-hidden rounded-xl ring-1 ring-black/[0.08]">
                <a
                  href={`tel:${appointment.clientContact}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-black/[0.02]"
                >
                  <span className="text-xs font-medium tracking-[0.06em] text-muted uppercase">Contact</span>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Phone className="size-3.5 text-muted" aria-hidden />
                    {appointment.clientContact}
                  </span>
                </a>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-xs font-medium tracking-[0.06em] text-muted uppercase">Date &amp; time</span>
                  <span className="text-right text-sm font-semibold">
                    {formatDateFull(appointment.date)}
                    <span className="block text-xs font-normal text-muted">
                      {appointment.startTime}–{appointment.endTime}
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-xs font-medium tracking-[0.06em] text-muted uppercase">Mode</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      isOnline ? "bg-amber-500/[0.16] text-amber-800 dark:text-amber-300" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {isOnline ? "Online" : "On-Site"}
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
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-black/[0.08] transition hover:bg-black/[0.03] hover:text-foreground"
              >
                <CalendarClock className="size-3.5" aria-hidden />
                Reschedule
              </button>
              <form className="ml-auto flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={appointment.id} />
                <input type="hidden" name="slug" value={practitionerSlug} />
                <button
                  type="submit"
                  formAction={declineAppointment}
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-muted ring-1 ring-black/[0.08] transition hover:bg-alert/[0.06] hover:text-alert"
                >
                  <X className="size-4" aria-hidden />
                  Decline
                </button>
                <button
                  type="submit"
                  formAction={approveAppointment}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  <Check className="size-4" aria-hidden />
                  Approve
                </button>
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
