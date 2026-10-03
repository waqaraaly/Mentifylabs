"use client";

import { useState } from "react";
import Link from "next/link";
import { Ban, CalendarOff, CalendarRange, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatDayCell, formatRange12h, isToday, todayIsoDate } from "@/lib/format";
import type { Slot } from "@/types/slot";
import type { Appointment } from "@/types/appointment";
import type { WeeklyRule, DayOverride } from "@/types/availability";
import { DayPanel } from "./DayPanel";
import { BlockDatesModal } from "./BlockDatesModal";
import { MonthWeekPicker } from "./MonthWeekPicker";
import { WeeklyPatternGrid } from "./WeeklyPatternGrid";
import { CustomDatesList } from "./CustomDatesList";
import { slotChipClass } from "./slotStyles";
import { sessionTypeLabel } from "@/lib/sessionType";
import {
  AcceptingBookingsSwitch,
  BookingsNotice,
  useAcceptingBookings,
} from "@/components/portal/AcceptingBookingsToggle";
import { PageHeader } from "@/components/ui/PageHeader";

function SlotBlock({
  slot,
  appointment,
  onViewAppointment,
  onManageSlot,
}: {
  slot: Slot;
  appointment?: Appointment;
  onViewAppointment: (slot: Slot) => void;
  onManageSlot: (slot: Slot) => void;
}) {
  const time = formatRange12h(slot.startTime, slot.endTime);
  const label = (
    <span className="flex flex-col items-center leading-tight">
      <span>{time}</span>
      <span className="text-[11px] font-medium opacity-75">{sessionTypeLabel(slot.sessionType)}</span>
    </span>
  );

  if (slot.status === "booked") {
    return (
      <button
        type="button"
        onClick={() => onViewAppointment(slot)}
        title={appointment ? `View details for ${appointment.clientName}` : undefined}
        className={`w-full shrink-0 rounded-lg px-2 py-2.5 text-center text-[12px] font-semibold whitespace-nowrap shadow-sm transition hover:brightness-105 ${slotChipClass(true)}`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onManageSlot(slot)}
      title="Manage this slot"
      className={`w-full shrink-0 rounded-lg px-2 py-2.5 text-center text-[12px] font-semibold whitespace-nowrap transition hover:brightness-95 ${slotChipClass(false)}`}
    >
      {label}
    </button>
  );
}

export function ManageSlotsBoard({
  acceptingBookings,
  monthLabel,
  selectedDate,
  prevHref,
  nextHref,
  view,
  days,
  practitionerSlug,
  appointmentBySlotId,
  weeklyRules,
  dayOverrideByDate,
  customDates,
  customDateSlots,
}: {
  acceptingBookings: boolean;
  monthLabel: string;
  selectedDate: string;
  prevHref: string;
  nextHref: string;
  view: "week" | "pattern";
  days: { date: string; slots: Slot[] }[];
  practitionerSlug: string;
  appointmentBySlotId: Map<string, Appointment>;
  weeklyRules: WeeklyRule[];
  dayOverrideByDate: Map<string, DayOverride>;
  customDates: DayOverride[];
  /** Each special date's non-blocked slots, keyed by date — used for the summary line. */
  customDateSlots: Record<string, Slot[]>;
}) {
  const bookings = useAcceptingBookings(acceptingBookings);
  const [manageDate, setManageDate] = useState<string | null>(null);
  const [manageDateLocked, setManageDateLocked] = useState(true);
  const [blockOpen, setBlockOpen] = useState(false);
  const [focusSlotId, setFocusSlotId] = useState<string | undefined>(undefined);

  function openDate(date: string, locked: boolean, slotId?: string) {
    setManageDateLocked(locked);
    setFocusSlotId(slotId);
    setManageDate(date);
  }

  const cardClass =
    "overflow-hidden rounded-2xl bg-surface ring-1 ring-black/[0.07]";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarRange}
        title="Availability"
        description={
          view === "week"
            ? "See what is open and booked each week."
            : "Set your regular weekly hours and one-off special dates."
        }
        actions={
          <>
            <AcceptingBookingsSwitch {...bookings} />
            <button
              type="button"
              onClick={() => setBlockOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-4 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-foreground/[0.05]"
            >
              <Ban className="size-4 text-muted" aria-hidden />
              Mark unavailable
            </button>
            <button
              type="button"
              onClick={() => openDate(todayIsoDate(), false)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden />
              Add availability
            </button>
          </>
        }
      />

      <BookingsNotice {...bookings} />

      {view === "week" ? (
        <div className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
            <p className="text-base font-semibold tracking-tight">{monthLabel}</p>
            <div className="flex items-center gap-1">
              <Link
                href={prevHref}
                aria-label="Previous week"
                className="flex size-11 items-center justify-center rounded-full text-muted transition hover:bg-foreground/[0.05] hover:text-foreground"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Link>
              <MonthWeekPicker selectedDate={selectedDate} />
              <Link
                href={nextHref}
                aria-label="Next week"
                className="flex size-11 items-center justify-center rounded-full text-muted transition hover:bg-foreground/[0.05] hover:text-foreground"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border bg-foreground/[0.03] px-6 py-3 text-xs font-medium text-muted">
            <span className="flex items-center gap-2">
              <span className="h-3 w-5 rounded-sm bg-surface ring-1 ring-primary/[0.45]" aria-hidden />
              Open
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-5 rounded-sm bg-primary" aria-hidden />
              Booked
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-5 rounded-sm ring-1 ring-border"
                style={{ backgroundImage: "repeating-linear-gradient(135deg, color-mix(in srgb, var(--foreground) 7%, transparent) 0 6px, transparent 6px 12px)" }}
                aria-hidden
              />
              Unavailable
            </span>
          </div>

          <div className="p-4">
            {/* Phones and tablets: a plain day-by-day list. lg and up: one scroll for the whole 7-column calendar, with the day headers staying put while the slots scroll. */}
            <div className="themed-scrollbar rounded-lg ring-1 ring-border lg:h-[clamp(440px,calc(100vh-375px),760px)] lg:overflow-auto">
            <div className="grid min-h-full grid-cols-1 divide-y divide-border lg:min-w-[900px] lg:grid-cols-7 lg:divide-x lg:divide-y-0">
              {days.map(({ date, slots: allSlots }) => {
                const slots = allSlots.filter((s) => s.status !== "unavailable");
                const cell = formatDayCell(date);
                const today = isToday(date);
                const override = dayOverrideByDate.get(date);

                return (
                  <div
                    key={date}
                    className={`flex flex-col ${today ? "bg-primary/[0.04]" : ""}`}
                    style={
                      override?.type === "unavailable"
                        ? { backgroundImage: "repeating-linear-gradient(135deg, color-mix(in srgb, var(--foreground) 7%, transparent) 0 6px, transparent 6px 12px)" }
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      onClick={() => openDate(date, true)}
                      aria-label={`Manage slots for ${cell.weekday} ${cell.day}`}
                      className={`flex h-12 w-full flex-row items-center justify-start gap-2.5 border-b border-border px-4 text-left transition hover:brightness-95 lg:sticky lg:top-0 lg:z-10 lg:h-[56px] lg:flex-col lg:justify-center lg:gap-0 lg:px-2 lg:text-center ${
                        today
                          ? "bg-primary text-primary-foreground"
                          : "bg-[color-mix(in_srgb,var(--foreground)_4%,var(--surface))]"
                      }`}
                    >
                      <p className="text-sm font-bold tracking-wide">
                        {cell.day} {cell.month}
                      </p>
                      <p className={`text-[11px] uppercase lg:mt-0.5 ${today ? "text-primary-foreground/85" : "text-muted"}`}>
                        {cell.weekday.slice(0, 3)}
                        {today && <span className="ml-1 font-bold">· Today</span>}
                        {override?.type === "custom" && (
                          <span className={`ml-1 font-bold ${today ? "" : "text-primary"}`}>· Special</span>
                        )}
                      </p>
                    </button>

                    <div className="flex flex-1 flex-col justify-start gap-1.5 p-1.5">
                      {override?.type === "unavailable" && (
                        <p className="flex items-center justify-center gap-1 pt-2 pb-1 text-[11px] font-medium text-muted">
                          <Ban className="size-3" aria-hidden />
                          Unavailable
                        </p>
                      )}
                      {slots.length === 0 && override?.type !== "unavailable" && (
                        <p className="flex items-center justify-center gap-1 pt-2 text-[11px] text-muted">
                          <CalendarOff className="size-3" aria-hidden />
                          No slots
                        </p>
                      )}
                      {(override?.type === "unavailable" ? slots.filter((s) => s.status === "booked") : slots).map(
                        (slot) => (
                          <SlotBlock
                            key={slot.id}
                            slot={slot}
                            appointment={appointmentBySlotId.get(slot.id)}
                            onViewAppointment={(s) => openDate(s.date, true, s.id)}
                            onManageSlot={(s) => openDate(s.date, true, s.id)}
                          />
                        ),
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className={cardClass}>
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b border-border px-6 py-5">
              <div>
                <p className="text-base font-semibold tracking-tight">Weekly hours</p>
                <p className="text-sm text-muted">Your regular availability. Repeats every week until you change it. Changes here don&apos;t affect dates listed under Special dates.</p>
              </div>
            </div>
            <WeeklyPatternGrid weeklyRules={weeklyRules} practitionerSlug={practitionerSlug} />
          </div>

          <div className={`${cardClass} lg:sticky lg:top-6`}>
            <div className="border-b border-border px-6 py-5">
              <p className="text-base font-semibold tracking-tight">Special dates</p>
              <p className="text-sm text-muted">One-off changes that override your weekly hours.</p>
            </div>
            <CustomDatesList customDates={customDates} slotsByDate={customDateSlots} onManageDate={(date) => openDate(date, true)} />
          </div>
        </div>
      )}

      {blockOpen && (
        <BlockDatesModal
          initialDate={todayIsoDate()}
          practitionerSlug={practitionerSlug}
          onClose={() => setBlockOpen(false)}
        />
      )}

      {manageDate && (
        <DayPanel
          key={`${manageDate}-${focusSlotId ?? ""}`}
          initialDate={manageDate}
          dateLocked={manageDateLocked}
          focusSlotId={focusSlotId}
          practitionerSlug={practitionerSlug}
          getAppointment={(slotId) => appointmentBySlotId.get(slotId)}
          variant="modal"
          onClose={() => setManageDate(null)}
        />
      )}
    </div>
  );
}
