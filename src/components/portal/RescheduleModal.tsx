"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, X } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Slot } from "@/types/slot";
import { rescheduleAppointmentAction } from "@/app/dashboard/sessions/actions";
import { RescheduleFields } from "./RescheduleFields";

export function RescheduleModal({
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
      onClose();
      router.refresh();
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-black/[0.06] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.1] text-primary">
              <CalendarClock className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Reschedule appointment</h2>
              <p className="mt-0.5 text-sm text-muted">For {appointment.clientName}&apos;s session</p>
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

        <form onSubmit={submitReschedule} className="mt-6">
          <input type="hidden" name="id" value={appointment.id} />
          <input type="hidden" name="slug" value={practitionerSlug} />

          <RescheduleFields openSlots={openSlots} />

          {error && (
            <p role="alert" className="mt-5 text-sm font-medium text-alert">
              {error}
            </p>
          )}

          <div className="mt-7 flex items-center justify-end gap-3 border-t border-black/[0.06] pt-6">
            <button
              type="button"
              onClick={onClose}
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
      </div>
    </>
  );
}
