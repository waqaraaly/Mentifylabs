"use client";

import { useState, useTransition, type FormEvent } from "react";
import { sessionTypeLabel } from "@/lib/sessionType";
import { useRouter } from "next/navigation";
import { CalendarClock, X } from "lucide-react";
import type { Slot } from "@/types/slot";
import { formatDate } from "@/lib/format";
import { rescheduleAppointmentAction } from "@/app/dashboard/sessions/actions";

const fieldClass =
  "w-full rounded-lg bg-black/[0.03] px-3 py-2.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-primary/40";

const labelClass = "text-xs font-medium tracking-[0.06em] text-muted uppercase";

export function RescheduleDialog({
  appointmentId,
  clientName,
  practitionerSlug,
  openSlots,
}: {
  appointmentId: string;
  clientName: string;
  practitionerSlug: string;
  openSlots: Slot[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await rescheduleAppointmentAction(formData);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-black/[0.08] transition hover:bg-black/[0.03] hover:text-foreground"
      >
        <CalendarClock className="size-3.5" aria-hidden />
        Reschedule
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface shadow-2xl ring-1 ring-black/[0.06]">
            <div className="flex items-start justify-between gap-4 px-7 pt-7">
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.1] text-primary">
                  <CalendarClock className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Reschedule appointment</h3>
                  <p className="mt-0.5 text-sm text-muted">For {clientName}&apos;s request</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-black/[0.05] hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 px-7">
              <input type="hidden" name="id" value={appointmentId} />
              <input type="hidden" name="slug" value={practitionerSlug} />

              {openSlots.length > 0 && (
                <>
                  <div>
                    <label htmlFor="reschedule-slot" className={labelClass}>
                      Pick an open slot
                    </label>
                    <select id="reschedule-slot" name="slotId" className={`mt-2 ${fieldClass}`} defaultValue="">
                      <option value="">— Select a slot —</option>
                      {openSlots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {formatDate(slot.date)}, {slot.startTime}–{slot.endTime} ({sessionTypeLabel(slot.sessionType)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-black/[0.08]" />
                    <span className="text-xs font-medium text-muted uppercase">Or</span>
                    <div className="h-px flex-1 bg-black/[0.08]" />
                  </div>
                </>
              )}

              <div className="space-y-3">
                <p className={labelClass}>Set a custom time</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reschedule-date" className="text-xs text-muted">
                      Date
                    </label>
                    <input id="reschedule-date" type="date" name="date" className={`mt-1 ${fieldClass}`} />
                  </div>
                  <div>
                    <label htmlFor="reschedule-mode" className="text-xs text-muted">
                      Session mode
                    </label>
                    <select id="reschedule-mode" name="sessionType" defaultValue="online" className={`mt-1 ${fieldClass}`}>
                      <option value="online">Online</option>
                      <option value="offline">On-Site</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reschedule-start" className="text-xs text-muted">
                      Start time
                    </label>
                    <input id="reschedule-start" type="time" name="startTime" className={`mt-1 ${fieldClass}`} />
                  </div>
                  <div>
                    <label htmlFor="reschedule-end" className="text-xs text-muted">
                      End time
                    </label>
                    <input id="reschedule-end" type="time" name="endTime" className={`mt-1 ${fieldClass}`} />
                  </div>
                </div>
              </div>

              <div className="mt-7 flex items-center justify-end gap-3 border-t border-black/[0.06] px-0 py-5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-5 py-2.5 text-sm font-medium text-muted ring-1 ring-black/[0.08] transition hover:bg-black/[0.04]"
                >
                  Cancel
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
      )}
    </>
  );
}
