"use client";

import {
  useActionState,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import { CalendarClock, Check, Mail, Phone, Sparkles, X } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Slot } from "@/types/slot";
import {
  bookAppointment,
  type BookingFormState,
} from "@/app/[username]/actions";
import { formatDateFull, formatDayCell } from "@/lib/format";
import { formatFeeRange } from "@/lib/fees";
import { ArrowScroller } from "@/components/ui/ArrowScroller";
import { useInBrowser } from "@/lib/useInBrowser";
import { useViewerTimeZone } from "@/lib/useViewerTimeZone";
import {
  displayZoneFor,
  notStarted,
  openingFormat,
  shownIn,
  type ShownTimes,
} from "@/lib/viewerTime";
import { ViewerTimeZoneNote } from "./ViewerTimeZoneNote";

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
}: ComponentPropsWithoutRef<"input"> & {
  id: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-medium tracking-[0.1em] text-(--pt-muted) uppercase"
      >
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

// Email and phone the practitioner has made public, as links a visitor can use to ask about times.
function publicReachLinks(practitioner: Practitioner) {
  return practitioner.contactMethods
    .filter((c) => c.isPublic && c.value)
    .flatMap((c) => {
      const value = c.value.trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return [{ label: value, href: `mailto:${value}`, Icon: Mail }];
      if (/^\+?[\d\s()-]{7,}$/.test(value))
        return [
          {
            label: value,
            href: `tel:${value.replace(/[^\d+]/g, "")}`,
            Icon: Phone,
          },
        ];
      return [];
    });
}

export function BookingModal({
  practitioner,
  slots: allSlots,
}: {
  practitioner: Practitioner;
  slots: Slot[];
}) {
  const practitionerZone = practitioner.timezone;
  const inBrowser = useInBrowser();
  const viewer = useViewerTimeZone(practitionerZone);
  // The page can be a copy made up to an hour ago, so slots that have started since are dropped here, on the
  // practitioner's clock. Until the browser has taken over, the list is exactly what the server sent.
  const slots = inBrowser ? notStarted(allSlots, practitionerZone) : allSlots;
  const boundAction = useMemo(
    () => bookAppointment.bind(null, practitioner.slug),
    [practitioner.slug],
  );
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // A slot marked "both" fits either format, so the practitioner's own session
  // mode (set in the portal) has to gate which formats are offered at all.
  const offersOnline =
    practitioner.sessionType !== "offline" &&
    slots.some((s) => s.sessionType !== "offline");
  const offersOffline =
    practitioner.sessionType !== "online" &&
    slots.some((s) => s.sessionType !== "online");
  const [format, setFormat] = useState<Format | null>(null);
  // Opens on the format of the earliest slot, so the date the "Next available" bar names is the first one shown.
  const activeFormat =
    format ??
    openingFormat(slots, { online: offersOnline, offline: offersOffline });

  // Online sessions are shown on the visitor's clock, sessions on-site on the practitioner's. The day can differ between
  // the two, so the days and the times within them are grouped by what the visitor will actually see.
  const displayZone = displayZoneFor(
    activeFormat,
    practitionerZone,
    viewer.zone,
  );
  const filtered = slots.filter(
    (s) => s.sessionType === activeFormat || s.sessionType === "both",
  );
  const shown = new Map<string, ShownTimes>(
    filtered.map((s) => [s.id, shownIn(s, practitionerZone, displayZone)]),
  );
  const groups = new Map<string, Slot[]>();
  for (const slot of filtered) {
    const day = shown.get(slot.id)!.date;
    const group = groups.get(day) ?? [];
    group.push(slot);
    groups.set(day, group);
  }
  for (const group of groups.values())
    group.sort((a, b) =>
      shown.get(a.id)!.startTime.localeCompare(shown.get(b.id)!.startTime),
    );
  const dateEntries = [...groups.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  const activeDate =
    selectedDate && groups.has(selectedDate)
      ? selectedDate
      : (dateEntries[0]?.[0] ?? null);
  const timesForDate = groups.get(activeDate ?? "") ?? [];
  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null;
  const selectedShown = selectedSlot
    ? (shown.get(selectedSlot.id) ??
      shownIn(selectedSlot, practitionerZone, displayZone))
    : null;
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

  // No times at all: the booking steps would be empty, so the visitor gets a short, separate message instead.
  if (noSlotsAtAll) {
    const reachLinks = publicReachLinks(practitioner);
    const firstName = practitioner.fullName.split(" ")[0];
    return (
      <dialog
        id={BOOKING_MODAL_ID}
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) handleClose();
        }}
        className="m-auto w-[calc(100%-1.25rem)] max-w-md overflow-hidden rounded-[24px] border-0 bg-(--pt-bg) p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm sm:w-full sm:rounded-[28px]"
      >
        <div className="relative px-6 py-9 text-center sm:px-10 sm:py-11">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-4 right-4 rounded-full p-1.5 text-(--pt-muted) transition hover:bg-black/5 hover:text-(--pt-text)"
          >
            <X className="size-6" aria-hidden />
          </button>
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-(--pt-accent)/10 text-(--pt-accent)">
            <CalendarClock className="size-7" aria-hidden />
          </span>
          <h3 className="mt-5 font-serif text-2xl leading-tight font-semibold tracking-tight text-(--pt-text)">
            No session times open yet
          </h3>
          <p className="mt-3 text-base leading-relaxed text-(--pt-muted)">
            {firstName} hasn&apos;t opened any session times yet, so booking
            isn&apos;t available just now.
            {reachLinks.length > 0
              ? " You can get in touch directly to ask about a time."
              : " Please check back soon."}
          </p>
          {reachLinks.length > 0 && (
            <div className="mt-6 flex flex-col items-stretch gap-2.5">
              {reachLinks.map(({ label, href, Icon }) => (
                <a
                  key={href}
                  href={href}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-(--pt-border) px-5 py-3 text-[15px] font-medium break-all text-(--pt-text) transition hover:border-(--pt-accent)"
                >
                  <Icon
                    className="size-4 shrink-0 text-(--pt-accent)"
                    aria-hidden
                  />
                  {label}
                </a>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-(--pt-accent) px-8 py-3 text-base font-semibold text-(--pt-accent-foreground) transition hover:bg-(--pt-accent-hover)"
          >
            Close
          </button>
        </div>
      </dialog>
    );
  }

  return (
    <dialog
      id={BOOKING_MODAL_ID}
      ref={dialogRef}
      onClose={resetWizard}
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose();
      }}
      className="m-auto w-[calc(100%-1.25rem)] max-w-4xl overflow-hidden rounded-[24px] border-0 bg-(--pt-bg) p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm sm:w-full sm:rounded-[28px]"
    >
      <div className="flex max-h-[90dvh] flex-col md:flex-row">
        {/* Sidebar — name, step tracker, and a live summary that fills in
            as the wizard progresses. */}
        <div className="shrink-0 bg-(--pt-modal-sidebar) px-6 py-5 text-(--pt-accent-foreground) md:w-[360px] md:p-12">
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] text-(--pt-accent-foreground)/60 uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            Booking
          </div>
          <h2 className="mt-2 font-serif text-2xl leading-[1.2] font-semibold md:mt-4 md:text-[32px]">
            Session with{" "}
            <span className="text-(--pt-accent-foreground) italic">
              {practitioner.fullName}
            </span>
          </h2>
          {/* On a phone the side panel shrinks to this one line, so the choices below get the room. */}
          <p className="mt-2 text-sm text-(--pt-accent-foreground)/70 md:hidden">
            Step {step} of {STEPS.length} ·{" "}
            {STEPS.find((s) => s.id === step)?.label}
          </p>
          <p className="mt-3 hidden text-base text-(--pt-accent-foreground)/70 md:block">
            A few quick details and you&apos;re set.
          </p>

          <ol className="mt-10 hidden space-y-6 md:block">
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
                      isActive || isDone
                        ? "text-(--pt-accent-foreground)"
                        : "text-(--pt-accent-foreground)/50"
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-12 hidden space-y-3.5 border-t border-(--pt-accent-foreground)/15 pt-7 text-sm md:block">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.1em] text-(--pt-accent-foreground)/50 uppercase">
                Session mode
              </span>
              <span className="text-base font-medium">
                {activeFormat
                  ? activeFormat === "online"
                    ? "Online"
                    : "On-Site"
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.1em] text-(--pt-accent-foreground)/50 uppercase">
                When
              </span>
              <span className="text-base font-medium">
                {selectedShown
                  ? `${formatDateFull(selectedShown.date)}, ${selectedShown.startTime} ${selectedShown.tag}`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs tracking-[0.1em] text-(--pt-accent-foreground)/50 uppercase">
                Fee
              </span>
              <span className="font-serif text-xl font-semibold">
                {formatFeeRange(practitioner.feeRange) ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Content — swaps per step. */}
        <div className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-8 md:p-12">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-serif text-2xl leading-tight font-semibold tracking-tight text-(--pt-text) md:text-[28px]">
              {state.status === "success"
                ? "Booking requested"
                : step === 1
                  ? "Choose a time"
                  : "Your details"}
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

          <div className="mt-6 flex-1 md:mt-8">
            {state.status === "success" ? (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-(--pt-accent)/10 text-(--pt-accent)">
                  <Check className="size-7" aria-hidden />
                </span>
                <p className="mt-5 max-w-sm text-base text-(--pt-text)/80">
                  {state.message}
                </p>
              </div>
            ) : step === 1 ? (
              <div className="space-y-8">
                {offersOnline && offersOffline && (
                  <div>
                    <p className="text-xs font-semibold tracking-[0.1em] text-(--pt-muted) uppercase">
                      Session mode
                    </p>
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
                        On-Site
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.1em] text-(--pt-muted) uppercase">
                    Select a date
                  </p>
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
                              isActiveDate
                                ? "text-(--pt-accent-foreground)/70"
                                : "text-(--pt-muted)"
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
                      <p className="text-sm text-(--pt-muted)">
                        No slots available for this format right now.
                      </p>
                    )}
                  </ArrowScroller>
                </div>

                <ViewerTimeZoneNote
                  format={activeFormat}
                  practitionerZone={practitionerZone}
                  viewerZone={viewer.zone}
                />

                {timesForDate.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold tracking-[0.1em] text-(--pt-muted) uppercase">
                      Available times
                    </p>
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
                            {shown.get(slot.id)?.startTime ?? slot.startTime}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form
                id="booking-details-form"
                action={formAction}
                className="space-y-5"
              >
                <input
                  type="hidden"
                  name="slotId"
                  value={selectedSlotId ?? ""}
                />
                <input type="hidden" name="format" value={activeFormat ?? ""} />

                {selectedSlot && selectedShown && (
                  <div className="rounded-xl bg-(--pt-accent)/5 px-4 py-3.5 text-sm">
                    <p className="font-medium text-(--pt-text)">
                      {formatDateFull(selectedShown.date)},{" "}
                      {selectedShown.startTime}–{selectedShown.endTime}{" "}
                      {selectedShown.tag}
                    </p>
                    <p className="mt-0.5 capitalize text-(--pt-muted)">
                      {activeFormat} session
                    </p>
                  </div>
                )}

                <FormField
                  id="fullName"
                  name="fullName"
                  label="Full name"
                  type="text"
                  required
                />
                <FormField
                  id="contactNumber"
                  name="contactNumber"
                  label="Contact number"
                  type="tel"
                  required
                />
                <div>
                  <label
                    htmlFor="concern"
                    className="text-xs font-medium tracking-[0.1em] text-(--pt-muted) uppercase"
                  >
                    What would you like help with?{" "}
                    <span className="normal-case">(optional)</span>
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
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-(--pt-border) pt-5 md:mt-10 md:pt-6">
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
          )}
        </div>
      </div>
    </dialog>
  );
}
