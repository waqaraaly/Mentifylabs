"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, TriangleAlert } from "lucide-react";
import {
  addDays,
  diffMinutes,
  formatDate,
  formatDateFull,
  formatTime12h,
} from "@/lib/format";
import { sessionTypeLabel, type SlotSessionType } from "@/lib/sessionType";
import {
  addSlotAction,
  deleteSlotAction,
  updateSlotDetailsAction,
  getSlotsForDateAction,
  getDayOverrideAction,
  markDateUnavailableAction,
  applyWeeklyHoursForDateAction,
} from "@/app/dashboard/slots/actions";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { SidePanel } from "./SidePanel";
import { SessionTypePicker } from "./SessionTypePicker";
import type { Slot } from "@/types/slot";
import type { Appointment } from "@/types/appointment";
import type { DayOverride } from "@/types/availability";

const fieldClass =
  "w-full rounded-lg bg-surface px-3.5 py-2.5 text-base outline-none ring-1 ring-border transition focus:ring-2 focus:ring-primary/50";
const labelClass = "block text-sm font-medium text-muted";
const primaryButton =
  "rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50";
const quietButton =
  "rounded-lg px-3 py-2.5 text-sm font-semibold text-muted transition hover:text-foreground";

function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-7 py-4">
      {children}
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-alert">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{message}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 text-base">{children}</dd>
    </div>
  );
}

/** Read-only view of a booked slot's appointment. */
function BookedView({
  slot,
  appointment,
  onBack,
}: {
  slot: Slot;
  appointment?: Appointment;
  onBack: () => void;
}) {
  const type = appointment?.sessionType ?? slot.sessionType;
  return (
    <>
      <div className="flex-1 space-y-5 overflow-y-auto px-7 py-4">
        {appointment ? (
          <dl className="space-y-5">
            <Field label="Time">
              {formatTime12h(slot.startTime)} – {formatTime12h(slot.endTime)}{" "}
              <span className="text-muted">
                · {diffMinutes(slot.startTime, slot.endTime)} min ·{" "}
                {sessionTypeLabel(type)}
              </span>
            </Field>
            <Field label="Client">{appointment.clientName}</Field>
            <Field label="Contact">{appointment.clientContact || "—"}</Field>
            <Field label="Status">
              <span className="capitalize">{appointment.status}</span>
            </Field>
            {appointment.concern && (
              <Field label="Concern">{appointment.concern}</Field>
            )}
          </dl>
        ) : (
          <p className="text-sm text-muted">
            This slot is booked, but the appointment details couldn&apos;t be
            found.
          </p>
        )}
        <p className="text-sm text-muted">
          To change or cancel this session, use the Sessions page.
        </p>
      </div>
      <Footer>
        <Link
          href="/dashboard/sessions"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Open in Sessions
        </Link>
        <button type="button" onClick={onBack} className={primaryButton}>
          Done
        </button>
      </Footer>
    </>
  );
}

/** Edit form for one open slot. */
function SlotEditView({
  slot,
  practitionerSlug,
  onBack,
  onChanged,
}: {
  slot: Slot;
  practitionerSlug: string;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [startTime, setStartTime] = useState(slot.startTime);
  const [endTime, setEndTime] = useState(slot.endTime);
  const [sessionType, setSessionType] = useState<SlotSessionType>(
    slot.sessionType,
  );
  const [pending, setPending] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validRange = startTime !== "" && endTime !== "" && startTime < endTime;
  const changed =
    startTime !== slot.startTime ||
    endTime !== slot.endTime ||
    sessionType !== slot.sessionType;

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validRange) {
      setError("End time must be after the start time.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await updateSlotDetailsAction(new FormData(e.currentTarget));
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onChanged();
  }

  async function handleRemove() {
    setPending(true);
    const formData = new FormData();
    formData.set("id", slot.id);
    formData.set("slug", practitionerSlug);
    await deleteSlotAction(formData);
    setPending(false);
    onChanged();
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-7 py-4">
        <form id="slot-edit-form" onSubmit={handleSave} className="space-y-5">
          <input type="hidden" name="id" value={slot.id} />
          <input type="hidden" name="slug" value={practitionerSlug} />
          <input type="hidden" name="sessionType" value={sessionType} />

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className={labelClass}>Start time</span>
              <input
                type="time"
                name="startTime"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className={labelClass}>End time</span>
              <input
                type="time"
                name="endTime"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={fieldClass}
              />
            </label>
          </div>

          <SessionTypePicker value={sessionType} onChange={setSessionType} />

          {error && <ErrorNote message={error} />}

          <p className="text-sm text-muted">
            Applies to this date only, which then uses custom hours.
          </p>
        </form>
      </div>

      <Footer>
        {confirmingRemove ? (
          <>
            <p className="text-sm font-medium">Remove this slot?</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmingRemove(false)}
                disabled={pending}
                className={quietButton}
              >
                Keep
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={pending}
                className="rounded-lg bg-alert px-5 py-2.5 text-sm font-semibold text-alert-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {pending ? "Removing…" : "Remove"}
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setConfirmingRemove(true)}
              disabled={pending}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-alert transition hover:bg-alert/[0.08] disabled:opacity-60"
            >
              Remove
            </button>
            <div className="flex items-center gap-1">
              <button type="button" onClick={onBack} className={quietButton}>
                Cancel
              </button>
              <button
                type="submit"
                form="slot-edit-form"
                disabled={pending || !changed}
                className={primaryButton}
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        )}
      </Footer>
    </>
  );
}

export function DayPanel({
  initialDate,
  dateLocked = false,
  focusSlotId,
  practitionerSlug,
  getAppointment,
  variant = "panel",
  onClose,
}: {
  initialDate: string;
  /** True when opened from a specific date — shows that date with day arrows instead of a date picker. */
  dateLocked?: boolean;
  /** A slot to open straight into its detail view. */
  focusSlotId?: string;
  practitionerSlug: string;
  /** Looks up the appointment behind a booked slot. */
  getAppointment: (slotId: string) => Appointment | undefined;
  /** "modal" opens it as a centred dialog instead of the side panel. */
  variant?: "panel" | "modal";
  onClose: () => void;
}) {
  const [date, setDate] = useState(initialDate);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSlots, setExistingSlots] = useState<Slot[]>([]);
  const [override, setOverride] = useState<DayOverride | null>(null);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [sessionType, setSessionType] = useState<SlotSessionType>("online");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(
    focusSlotId ?? null,
  );
  const [confirmingBlock, setConfirmingBlock] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getSlotsForDateAction(practitionerSlug, date),
      getDayOverrideAction(practitionerSlug, date),
    ]).then(([slots, dayOverride]) => {
      if (!cancelled) {
        setExistingSlots(slots);
        setOverride(dayOverride);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [date, practitionerSlug]);

  async function refresh() {
    const [slots, dayOverride] = await Promise.all([
      getSlotsForDateAction(practitionerSlug, date),
      getDayOverrideAction(practitionerSlug, date),
    ]);
    setExistingSlots(slots);
    setOverride(dayOverride);
  }

  function changeDate(next: string) {
    setConfirmingBlock(false);
    setSelectedSlotId(null);
    setDate(next);
  }

  async function handleSlotChanged() {
    setSelectedSlotId(null);
    await refresh();
  }

  async function handleAddSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = e.currentTarget;
    const result = await addSlotAction(new FormData(form));

    setPending(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    form.reset();
    setAddOpen(false);
    await refresh();
  }

  const isUnavailable = override?.type === "unavailable";
  const isCustom = override?.type === "custom";
  const visibleSlots = existingSlots.filter((s) => s.status !== "unavailable");
  const bookedSlots = existingSlots.filter((s) => s.status === "booked");
  const selectedSlot = selectedSlotId
    ? (existingSlots.find((s) => s.id === selectedSlotId) ?? null)
    : null;

  function requestMarkUnavailable() {
    if (bookedSlots.length > 0) setConfirmingBlock(true);
    else void handleMarkUnavailable();
  }

  async function handleMarkUnavailable() {
    setConfirmingBlock(false);
    setTogglingAvailability(true);
    const formData = new FormData();
    formData.set("slug", practitionerSlug);
    formData.set("date", date);
    await markDateUnavailableAction(formData);
    await refresh();
    setTogglingAvailability(false);
  }

  async function handleResetToWeekly() {
    setTogglingAvailability(true);
    const formData = new FormData();
    formData.set("slug", practitionerSlug);
    formData.set("date", date);
    await applyWeeklyHoursForDateAction(formData);
    await refresh();
    setTogglingAvailability(false);
  }

  const statusText = isUnavailable
    ? bookedSlots.length > 0
      ? dateLocked
        ? "Unavailable for new bookings"
        : null
      : "Unavailable"
    : null;

  // Slot detail view — a booked slot shows its appointment, an open one shows the edit form.
  if (selectedSlotId && selectedSlot) {
    const booked = selectedSlot.status === "booked";
    return (
      <SidePanel
        title={booked ? "Booked session" : "Edit slot"}
        subtitle={formatDateFull(selectedSlot.date)}
        backLabel={formatDate(selectedSlot.date)}
        onBack={() => setSelectedSlotId(null)}
        onClose={onClose}
        variant={variant}
      >
        {booked ? (
          <BookedView
            slot={selectedSlot}
            appointment={getAppointment(selectedSlot.id)}
            onBack={() => setSelectedSlotId(null)}
          />
        ) : (
          <SlotEditView
            key={selectedSlot.id}
            slot={selectedSlot}
            practitionerSlug={practitionerSlug}
            onBack={() => setSelectedSlotId(null)}
            onChanged={handleSlotChanged}
          />
        )}
      </SidePanel>
    );
  }

  const renderRow = (slot: Slot) => {
    const booked = slot.status === "booked";
    return (
      <li key={slot.id}>
        <button
          type="button"
          onClick={() => setSelectedSlotId(slot.id)}
          className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-foreground/[0.03]"
        >
          <span>
            <span className="block text-sm font-semibold">
              {formatTime12h(slot.startTime)} – {formatTime12h(slot.endTime)}
            </span>
            <span className="block text-sm text-muted">
              {sessionTypeLabel(slot.sessionType)} ·{" "}
              <span className={booked ? "font-medium text-primary" : ""}>
                {booked ? "Booked" : "Open"}
              </span>
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
        </button>
      </li>
    );
  };

  return (
    <SidePanel
      title={dateLocked ? "Manage date" : "Add availability"}
      subtitle={
        dateLocked
          ? undefined
          : "For a specific date. Your weekly hours stay the same."
      }
      badge={
        statusText && (
          <span
            className={`text-sm font-medium ${isCustom ? "text-primary" : "text-muted"}`}
          >
            {statusText}
          </span>
        )
      }
      onClose={onClose}
      variant={variant}
    >
      <div className="flex-1 space-y-7 overflow-y-auto px-7 py-4">
        {dateLocked ? (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => changeDate(addDays(date, -1))}
              aria-label="Previous day"
              className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-foreground/[0.05] hover:text-foreground"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <p className="text-base font-semibold tracking-tight">
              {formatDateFull(date)}
            </p>
            <button
              type="button"
              onClick={() => changeDate(addDays(date, 1))}
              aria-label="Next day"
              className="flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-foreground/[0.05] hover:text-foreground"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        ) : (
          <section className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h3 className={labelClass}>Date</h3>
              <p className="text-sm font-semibold">{formatDateFull(date)}</p>
            </div>
            <MultiDateCalendar
              selectedDates={new Set([date])}
              onToggle={changeDate}
            />
          </section>
        )}

        <section>
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className={labelClass}>Slots</h3>
            {!isUnavailable && (
              <span className="text-sm text-muted">
                {visibleSlots.length}{" "}
                {visibleSlots.length === 1 ? "slot" : "slots"}
              </span>
            )}
          </div>

          {isUnavailable ? (
            <div className="space-y-4 pt-4">
              <div className="space-y-3 rounded-xl bg-foreground/[0.05] px-4 py-4 ring-1 ring-border">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    This date is unavailable
                  </p>
                  <p className="text-sm text-muted">
                    {bookedSlots.length > 0
                      ? "Clients can't book any more slots. Sessions already booked are still scheduled."
                      : "Clients can't book this date."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetToWeekly}
                  disabled={togglingAvailability}
                  className={`${primaryButton} w-full`}
                >
                  {togglingAvailability ? "Updating…" : "Make available again"}
                </button>
                <p className="text-center text-xs text-muted">
                  Restores your weekly hours for this date.
                </p>
              </div>
              {bookedSlots.length > 0 && (
                <div>
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <p className="text-sm font-medium text-muted">
                      Still scheduled
                    </p>
                    <Link
                      href="/dashboard/sessions"
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Manage in Sessions
                    </Link>
                  </div>
                  <ul className="divide-y divide-border">
                    {bookedSlots.map(renderRow)}
                  </ul>
                </div>
              )}
            </div>
          ) : visibleSlots.length === 0 ? (
            <p className="pt-4 text-sm text-muted">
              No slots on this date yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {visibleSlots.map(renderRow)}
            </ul>
          )}
        </section>

        {!isUnavailable && (
          <section>
            <button
              type="button"
              onClick={() => setAddOpen((open) => !open)}
              aria-expanded={addOpen}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <Plus
                className={`size-4 transition-transform ${addOpen ? "rotate-45" : ""}`}
                aria-hidden
              />
              Add a slot
            </button>

            {addOpen && (
              <form onSubmit={handleAddSubmit} className="mt-4 space-y-5">
                <input
                  type="hidden"
                  name="practitionerSlug"
                  value={practitionerSlug}
                />
                <input type="hidden" name="date" value={date} />
                <input type="hidden" name="sessionType" value={sessionType} />

                <p className="text-sm text-muted">
                  One-off slot for this date only. Your weekly hours stay the
                  same.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block space-y-1.5">
                    <span className={labelClass}>Start time</span>
                    <input
                      type="time"
                      name="startTime"
                      required
                      defaultValue="09:00"
                      className={fieldClass}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className={labelClass}>End time</span>
                    <input
                      type="time"
                      name="endTime"
                      required
                      defaultValue="09:50"
                      className={fieldClass}
                    />
                  </label>
                </div>

                <SessionTypePicker
                  value={sessionType}
                  onChange={setSessionType}
                />

                {error && <ErrorNote message={error} />}

                <button
                  type="submit"
                  disabled={pending}
                  className={`${primaryButton} w-full`}
                >
                  {pending ? "Adding…" : "Add slot"}
                </button>
              </form>
            )}
          </section>
        )}
      </div>

      <Footer>
        {confirmingBlock ? (
          <>
            <p className="max-w-[16rem] text-sm">
              {bookedSlots.length} booked{" "}
              {bookedSlots.length === 1 ? "session stays" : "sessions stay"}{" "}
              scheduled. Only open slots are blocked.
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setConfirmingBlock(false)}
                className={quietButton}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkUnavailable}
                disabled={togglingAvailability}
                className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-surface transition hover:opacity-90 disabled:opacity-60"
              >
                Block slots
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              {isUnavailable ? null : (
                <>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={handleResetToWeekly}
                      disabled={togglingAvailability}
                      className="rounded-lg px-3 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/[0.08] disabled:opacity-50"
                    >
                      Reset to weekly hours
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={requestMarkUnavailable}
                    disabled={togglingAvailability}
                    className={`${quietButton} disabled:opacity-50`}
                  >
                    Mark unavailable
                  </button>
                </>
              )}
            </div>
            <button type="button" onClick={onClose} className={primaryButton}>
              Done
            </button>
          </>
        )}
      </Footer>
    </SidePanel>
  );
}
