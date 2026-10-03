"use client";

import { useState, useTransition, type FormEvent } from "react";
import { sessionTypeLabel } from "@/lib/sessionType";
import { useRouter } from "next/navigation";
import { CalendarHeart, MapPin, Phone, Plus, User, Video, X } from "lucide-react";
import type { Slot } from "@/types/slot";
import { formatDateFull, isPastStart, todayIsoDate } from "@/lib/format";
import { scheduleSessionAction } from "@/app/dashboard/sessions/actions";

const fieldClass =
  "w-full rounded-xl bg-black/[0.03] px-3.5 py-3 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-primary/40";
const labelClass = "text-xs font-semibold tracking-[0.08em] text-muted uppercase";

export function ScheduleSessionButton({
  practitionerSlug,
  openSlots,
}: {
  practitionerSlug: string;
  openSlots: Slot[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        <Plus className="size-4" aria-hidden />
        Schedule session
      </button>

      {open && (
        <ScheduleSessionModal
          practitionerSlug={practitionerSlug}
          openSlots={openSlots}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ScheduleSessionModal({
  practitionerSlug,
  openSlots: allOpenSlots,
  onClose,
}: {
  practitionerSlug: string;
  openSlots: Slot[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // A session can't be scheduled for a time that has already gone by, so slots that have started aren't offered.
  const openSlots = allOpenSlots.filter((s) => !isPastStart(s.date, s.startTime));

  const hasOpenSlots = openSlots.length > 0;
  const [mode, setMode] = useState<"slot" | "custom">(hasOpenSlots ? "slot" : "custom");

  const [clientName, setClientName] = useState("");
  const [slotDate, setSlotDate] = useState(openSlots[0]?.date ?? todayIsoDate());
  const [slotId, setSlotId] = useState(openSlots[0]?.id ?? "");
  const [customDate, setCustomDate] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [customType, setCustomType] = useState<"online" | "offline">("online");

  const slotsOnDate = openSlots
    .filter((s) => s.date === slotDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const selectSlotDate = (date: string) => {
    setSlotDate(date);
    const stillValid = openSlots.some((s) => s.date === date && s.id === slotId);
    if (!stillValid) {
      const firstOnDate = openSlots.find((s) => s.date === date);
      setSlotId(firstOnDate?.id ?? "");
    }
  };

  const selectedSlot = openSlots.find((s) => s.id === slotId) ?? null;

  const preview =
    mode === "slot" && selectedSlot
      ? { date: selectedSlot.date, start: selectedSlot.startTime, end: selectedSlot.endTime, type: selectedSlot.sessionType === "both" ? customType : selectedSlot.sessionType }
      : mode === "custom" && customDate && customStart && customEnd && customDate >= todayIsoDate() && !isPastStart(customDate, customStart)
        ? { date: customDate, start: customStart, end: customEnd, type: customType }
        : null;

  const customInPast = !!customDate && (customDate < todayIsoDate() || (!!customStart && isPastStart(customDate, customStart)));
  const canSubmit =
    mode === "slot" ? !!selectedSlot : !!(customDate && customStart && customEnd) && !customInPast;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await scheduleSessionAction(formData);
      onClose();
      router.refresh();
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-surface shadow-2xl ring-1 ring-black/[0.06]">
        <div className="max-h-[88vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-7 py-6 sm:px-8">
            <div className="flex items-start gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.1] text-primary">
                <CalendarHeart className="size-5.5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Schedule a session</h2>
                <p className="mt-0.5 text-sm text-muted">For a phone or walk-in booking</p>
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

          <form onSubmit={submit} className="px-7 py-7 sm:px-8">
            <input type="hidden" name="slug" value={practitionerSlug} />

            <div>
              <p className={labelClass}>Client</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
                  <input
                    id="schedule-client-name"
                    type="text"
                    name="clientName"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Client name"
                    className={`${fieldClass} pl-10`}
                  />
                </div>
                <div className="relative">
                  <Phone className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
                  <input
                    id="schedule-client-contact"
                    type="tel"
                    name="clientContact"
                    placeholder="Phone number (optional)"
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between">
                <p className={labelClass}>Timing</p>
                {hasOpenSlots && (
                  <div className="inline-flex rounded-full bg-black/[0.04] p-1">
                    <button
                      type="button"
                      onClick={() => setMode("slot")}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        mode === "slot" ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Open slot
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("custom")}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        mode === "custom" ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
                      }`}
                    >
                      Custom time
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3">
                {mode === "slot" && hasOpenSlots ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="schedule-slot-date" className="text-xs text-muted">
                        Date
                      </label>
                      <input
                        id="schedule-slot-date"
                        type="date"
                        min={todayIsoDate()}
                        value={slotDate}
                        onChange={(e) => selectSlotDate(e.target.value)}
                        className={`mt-1 ${fieldClass}`}
                      />
                    </div>
                    <div>
                      <label htmlFor="schedule-slot-time" className="text-xs text-muted">
                        Time
                      </label>
                      {slotsOnDate.length > 0 ? (
                        <select
                          id="schedule-slot-time"
                          name="slotId"
                          value={slotId}
                          onChange={(e) => setSlotId(e.target.value)}
                          className={`mt-1 ${fieldClass}`}
                        >
                          {slotsOnDate.map((slot) => (
                            <option key={slot.id} value={slot.id}>
                              {slot.startTime}–{slot.endTime} ({sessionTypeLabel(slot.sessionType)})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="mt-1 flex h-[46px] items-center rounded-xl bg-black/[0.03] px-3.5 text-sm text-muted">
                          No open slots
                        </p>
                      )}
                    </div>
                    {selectedSlot?.sessionType === "both" && (
                      <div className="col-span-2">
                        <label htmlFor="schedule-slot-format" className="text-xs text-muted">
                          Session mode
                        </label>
                        <select
                          id="schedule-slot-format"
                          name="sessionType"
                          value={customType}
                          onChange={(e) => setCustomType(e.target.value as "online" | "offline")}
                          className={`mt-1 ${fieldClass}`}
                        >
                          <option value="online">Online</option>
                          <option value="offline">On-Site</option>
                        </select>
                      </div>
                    )}
                    <p className="col-span-2 text-xs text-muted">
                      Pick any date — including further out — to see your open slots for that day.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      name="date"
                      required
                      min={todayIsoDate()}
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className={`col-span-2 ${fieldClass} sm:col-span-1`}
                    />
                    <select
                      name="sessionType"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value as "online" | "offline")}
                      className={`col-span-2 ${fieldClass} sm:col-span-1`}
                    >
                      <option value="online">Online</option>
                      <option value="offline">On-Site</option>
                    </select>
                    <input
                      type="time"
                      name="startTime"
                      required
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className={fieldClass}
                    />
                    <input
                      type="time"
                      name="endTime"
                      required
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className={fieldClass}
                    />
                    {customInPast && (
                      <p className="col-span-2 text-xs text-alert">
                        That time has already passed. Pick a date and time that are still ahead.
                      </p>
                    )}
                  </div>
                )}
                {!hasOpenSlots && (
                  <p className="mt-2 text-xs text-muted">No open slots on your calendar — set a custom time instead.</p>
                )}
              </div>
            </div>

            <div
              className={`mt-6 rounded-2xl px-5 py-4 ring-1 transition ${
                preview ? "bg-primary/[0.05] ring-primary/[0.14]" : "bg-black/[0.02] ring-black/[0.06]"
              }`}
            >
              <p className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">Summary</p>
              {preview ? (
                <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-foreground/85">
                  <span className="font-semibold">{clientName || "This client"}</span>
                  <span>·</span>
                  <span>{formatDateFull(preview.date)}</span>
                  <span>·</span>
                  <span className="tabular-nums">
                    {preview.start}–{preview.end}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span>·</span>
                    {preview.type === "online" ? <Video className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}
                    {preview.type === "online" ? "Online" : "On-Site"}
                  </span>
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-muted">Fill in the details above to see what you&apos;re booking.</p>
              )}
            </div>

            <div className="mt-7 flex items-center justify-end gap-3 border-t border-black/[0.06] pt-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-muted ring-1 ring-black/[0.08] transition hover:bg-black/[0.04]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || !canSubmit}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {pending ? "Scheduling…" : "Schedule session"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
