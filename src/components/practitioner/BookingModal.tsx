"use client";

import { useActionState, useMemo, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { Check, Sparkles, X } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Slot } from "@/types/slot";
import { bookAppointment, type BookingFormState } from "@/app/[username]/actions";
import { formatDateFull, formatDayCell } from "@/lib/format";
import { formatFeeRange } from "@/lib/fees";
import { ArrowScroller } from "@/components/ui/ArrowScroller";

export const BOOKING_MODAL_ID = "booking-modal";

const initialState: BookingFormState = { status: "idle", message: "" };

type Format = "online" | "offline";
type Step = 1 | 2;

// Inspired by a reference booking flow: a fixed sidebar tracking progress
// and a live summary, next to a spacious content panel that swaps per
// step — recolored with the practitioner's own --pt-* theme (the same
// tokens ProfileHero/ReachOutCard/etc. use) instead of the dashboard's
// unrelated teal palette, so the modal always matches the profile it
// opens from.
const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Session" },
  { id: 2, label: "Details" },
];

function FormField({
  id,
  label,
  optional,
  ...props
}: ComponentPropsWithoutRef<"input"> & { id: string; label: string; optional?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium tracking-[0.1em] text-(--pt-muted) uppercase">
        {label}
        {optional && <span className="normal-case"> (optional)</span>}
      </label>
      <input
        id={id}
        {...props}
        className="mt-2.5 w-full rounded-xl border border-(--pt-input-border) bg-(--pt-input-bg) px-4 py-3 text-base text-(--pt-text) outline-none transition placeholder:text-(--pt-muted) focus:border-(--pt-accent)"
      />
    </div>
  );
}

export function BookingModal({ practitioner, slots }: { practitioner: Practitioner; slots: Slot[] }) {
  const boundAction = useMemo(() => bookAppointment.bind(null, practitioner.slug), [practitioner.slug]);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // A slot marked "both" fits either format, so the practitioner's own session
  // mode (set in the portal) has to gate which formats are offered at all.
  const offersOnline = practitioner.sessionType !== "offline" && slots.some((s) => s.sessionType !== "offline");
  const offersOffline = practitioner.sessionType !== "online" && slots.some((s) => s.sessionType !== "online");
  const [format, setFormat] = useState<Format | null>(null);
  const activeFormat = format ?? (offersOnline ? "online" : offersOffline ? "offline" : null);

  const filtered = slots.filter((s) => s.sessionType === activeFormat || s.sessionType === "both");
  const groups = new Map<string, Slot[]>();
  for (const slot of filtered) {
    const group = groups.get(slot.date) ?? [];
    group.push(slot);
    groups.set(slot.date, group);
  }
  const dateEntries = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const activeDate = selectedDate && groups.has(selectedDate) ? selectedDate : (dateEntries[0]?.[0] ?? null);
  const timesForDate = groups.get(activeDate ?? "") ?? [];
  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null;
  const noSlotsAtAll = slots.length === 0;

  function resetWizard() {
    setStep(1);
    setFormat(null);
    setSelectedSlotId(null);
    setSelectedDate(null);
  }

  function handleClose() {
    dialogRef.current?.close();
  }

  function chooseFormat(value: Format) {
    setFormat(value);
    setSelectedSlotId(null);
    setSelectedDate(null);
  }

  function chooseDate(value: string) {
    setSelectedDate(value);
    setSelectedSlotId(null);
  }

  return (
    <dialog
      id={BOOKING_MODAL_ID}
      ref={dialogRef}
      onClose={resetWizard}
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose();
      }}
      className="m-auto w-full max-w-4xl overflow-hidden rounded-[28px] border-0 bg-(--pt-bg) p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] flex-col md:flex-row">
        {/* Sidebar — name, step tracker, and a live summary that fills in
            as the wizard progresses. */}
        <div className="shrink-0 bg-(--pt-modal-sidebar) p-10 text-(--pt-accent-foreground) md:w-[360px] md:p-12">
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] text-(--pt-accent-foreground)/60 uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            Booking
          </div>
          <h2 className="mt-4 font-serif text-[32px] leading-[1.2] font-semibold">
            Session with <span className="text-(--pt-accent-foreground) italic">{practitioner.fullName}</span>
          </h2>
          <p className="mt-3 text-base text-(--pt-accent-foreground)/70">A few quick details and you&apos;re set.</p>

          <ol className="mt-10 space-y-6">
            {STEPS.map((s) => {
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <li key={s.id} className="flex items-center gap-3.5">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      isActive
                        ? "bg-white text-(--pt-text)"
                        : isDone
                          ? "bg-white/90 text-(--pt-text)"
                          : "border border-(--pt-accent-foreground)/30 text-(--pt-accent-foreground)/50"
                    }`}
                  >
                    {isDone ? <Check className="size-4" aria-hidden /> : s.id}
                  </span>
                  <span
                    className={`text-base font-medium ${
                      isActive || isDone ? "text-(--pt-accent-foreground)" : "text-(--pt-accent-foreground)/50"
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-12 space-y-3.5 border-t border-(--pt-accent-foreground)/15 pt-7 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.1em] text-(--pt-accent-foreground)/50 uppercase">Mode</span>
              <span className="text-base font-medium">
                {activeFormat ? (activeFormat === "online" ? "Online" : "Onsite") : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.1em] text-(--pt-accent-foreground)/50 uppercase">When</span>
              <span className="text-base font-medium">
                {selectedSlot ? `${formatDateFull(selectedSlot.date)}, ${selectedSlot.startTime}` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs tracking-[0.1em] text-(--pt-accent-foreground)/50 uppercase">Fee</span>
              <span className="font-serif text-xl font-semibold">
                {formatFeeRange(practitioner.feeRange) ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Content — swaps per step. */}
        <div className="flex flex-1 flex-col overflow-y-auto p-10 md:p-12">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-serif text-[28px] leading-tight font-semibold tracking-tight text-(--pt-text)">
              {state.status === "success" ? "Booking requested" : step === 1 ? "Choose a time" : "Your details"}
            </h3>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="shrink-0 rounded-full p-1.5 text-(--pt-muted) transition hover:bg-black/5 hover:text-(--pt-text)"
            >
              <X className="size-6" aria-hidden />
            </button>
          </div>

          <div className="mt-8 flex-1">
            {state.status === "success" ? (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-(--pt-accent)/10 text-(--pt-accent)">
                  <Check className="size-7" aria-hidden />
                </span>
                <p className="mt-5 max-w-sm text-base text-(--pt-text)/80">{state.message}</p>
              </div>
            ) : noSlotsAtAll ? (
              <p className="text-base text-(--pt-muted)">No slots are open right now. Please check back soon.</p>
            ) : step === 1 ? (
              <div className="space-y-8">
                {offersOnline && offersOffline && (
                  <div>
                    <p className="text-xs font-semibold tracking-[0.1em] text-(--pt-muted) uppercase">Session mode</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => chooseFormat("online")}
                        className={`rounded-2xl border-2 py-4 text-center text-base font-semibold transition ${
                          activeFormat === "online"
                            ? "border-(--pt-accent) bg-(--pt-accent) text-(--pt-accent-foreground)"
                            : "border-(--pt-border) text-(--pt-text) hover:border-(--pt-accent)/40"
                        }`}
                      >
                        Online
                      </button>
                      <button
                        type="button"
                        onClick={() => chooseFormat("offline")}
                        className={`rounded-2xl border-2 py-4 text-center text-base font-semibold transition ${
                          activeFormat === "offline"
                            ? "border-(--pt-accent) bg-(--pt-accent) text-(--pt-accent-foreground)"
                            : "border-(--pt-border) text-(--pt-text) hover:border-(--pt-accent)/40"
                        }`}
                      >
                        Onsite
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.1em] text-(--pt-muted) uppercase">Select a date</p>
                  <ArrowScroller compact className="mt-0 flex gap-2.5 py-1">
                    {dateEntries.map(([date]) => {
                      const cell = formatDayCell(date);
                      const isActiveDate = activeDate === date;
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => chooseDate(date)}
                          className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl border-2 px-5 py-3.5 transition ${
                            isActiveDate
                              ? "border-(--pt-accent) bg-(--pt-accent) text-(--pt-accent-foreground)"
                              : "border-(--pt-border) text-(--pt-text) hover:border-(--pt-accent)/40"
                          }`}
                        >
                          <span
                            className={`text-xs font-medium uppercase ${
                              isActiveDate ? "text-(--pt-accent-foreground)/70" : "text-(--pt-muted)"
                            }`}
                          >
                            {cell.weekday}
                          </span>
                          <span className="text-base font-semibold">
                            {cell.month} {cell.day}
                          </span>
                        </button>
                      );
                    })}
                    {dateEntries.length === 0 && (
                      <p className="text-sm text-(--pt-muted)">No slots available for this format right now.</p>
                    )}
                  </ArrowScroller>
                </div>

                {timesForDate.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold tracking-[0.1em] text-(--pt-muted) uppercase">Available times</p>
                    <div className="mt-3 grid grid-cols-3 gap-2.5">
                      {timesForDate.map((slot) => {
                        const checked = selectedSlotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`rounded-xl border-2 py-3 text-center text-sm font-semibold transition ${
                              checked
                                ? "border-(--pt-accent) bg-(--pt-accent) text-(--pt-accent-foreground)"
                                : "border-(--pt-border) text-(--pt-text) hover:border-(--pt-accent)/40"
                            }`}
                          >
                            {slot.startTime}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form id="booking-details-form" action={formAction} className="space-y-5">
                <input type="hidden" name="slotId" value={selectedSlotId ?? ""} />
                <input type="hidden" name="format" value={activeFormat ?? ""} />

                {selectedSlot && (
                  <div className="rounded-xl bg-(--pt-accent)/5 px-4 py-3.5 text-sm">
                    <p className="font-medium text-(--pt-text)">
                      {formatDateFull(selectedSlot.date)}, {selectedSlot.startTime}–{selectedSlot.endTime}
                    </p>
                    <p className="mt-0.5 capitalize text-(--pt-muted)">{activeFormat} session</p>
                  </div>
                )}

                <FormField id="fullName" name="fullName" label="Full name" type="text" required />
                <FormField id="contactNumber" name="contactNumber" label="Contact number" type="tel" required />
                <div>
                  <label htmlFor="concern" className="text-xs font-medium tracking-[0.1em] text-(--pt-muted) uppercase">
                    What would you like help with ? <span className="normal-case">(optional)</span>
                  </label>
                  <textarea
                    id="concern"
                    name="concern"
                    rows={4}
                    className="mt-2.5 w-full resize-none rounded-xl border border-(--pt-input-border) bg-(--pt-input-bg) px-4 py-3 text-base text-(--pt-text) outline-none transition focus:border-(--pt-accent)"
                  />
                </div>
                {state.status === "error" && (
                  <p role="alert" className="text-sm font-medium text-alert">
                    {state.message}
                  </p>
                )}
              </form>
            )}
          </div>

          {state.status === "success" ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center justify-center rounded-full bg-(--pt-accent) px-8 py-3 text-base font-semibold text-(--pt-accent-foreground) transition hover:bg-(--pt-accent-hover)"
              >
                Done
              </button>
            </div>
          ) : (
            !noSlotsAtAll && (
              <div className="mt-10 flex items-center justify-between border-t border-(--pt-border) pt-6">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm font-medium text-(--pt-muted) transition hover:text-(--pt-text)"
                  >
                    ← Back
                  </button>
                ) : (
                  <span />
                )}

                {step === 1 && (
                  <button
                    type="button"
                    disabled={!selectedSlot}
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-(--pt-accent) px-8 py-3 text-base font-semibold text-(--pt-accent-foreground) transition hover:bg-(--pt-accent-hover) disabled:opacity-40"
                  >
                    Continue
                  </button>
                )}
                {step === 2 && (
                  <button
                    type="submit"
                    form="booking-details-form"
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 rounded-full bg-(--pt-accent) px-8 py-3 text-base font-semibold text-(--pt-accent-foreground) transition hover:bg-(--pt-accent-hover) disabled:opacity-40"
                  >
                    {isPending ? "Booking…" : "Confirm booking"}
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </dialog>
  );
}
