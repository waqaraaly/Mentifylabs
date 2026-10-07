"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";
import { addDays, formatDayCell, formatTime12h } from "@/lib/format";
import {
  getConflictsAction,
  getSlotsForDateAction,
  getUnavailableDatesAction,
  markDatesUnavailableAction,
  markSlotsUnavailableAction,
} from "@/app/dashboard/slots/actions";
import { sessionTypeLabel } from "@/lib/sessionType";
import type { Slot } from "@/types/slot";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { SidePanel } from "./SidePanel";

type Conflict = { date: string; startTime: string; clientName: string; status: "pending" | "confirmed" };
type Group = { dates: string[] };

/** Splits sorted dates into runs of consecutive days. */
function groupDates(sorted: string[]): Group[] {
  const groups: Group[] = [];
  for (const date of sorted) {
    const last = groups[groups.length - 1];
    if (last && addDays(last.dates[last.dates.length - 1], 1) === date) last.dates.push(date);
    else groups.push({ dates: [date] });
  }
  return groups;
}

function groupLabel(group: Group): string {
  const first = formatDayCell(group.dates[0]);
  if (group.dates.length === 1) return `${first.day} ${first.month}`;
  const last = formatDayCell(group.dates[group.dates.length - 1]);
  return first.month === last.month
    ? `${first.day} – ${last.day} ${last.month}`
    : `${first.day} ${first.month} – ${last.day} ${last.month}`;
}

/** Pick one or more dates and mark them all unavailable at once, or, for a single date, just some of its slots. */
export function BlockDatesModal({
  initialDate,
  practitionerSlug,
  onClose,
}: {
  initialDate: string;
  practitionerSlug: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set([initialDate]));
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [alreadyUnavailable, setAlreadyUnavailable] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  // With exactly one date picked, the whole day can be blocked or only the slots ticked from that day's list.
  const [scope, setScope] = useState<"day" | "slots">("day");
  // Both are tied to the date they were made for, so picking another date starts them afresh.
  const [loaded, setLoaded] = useState<{ date: string; slots: Slot[] } | null>(null);
  const [tickedFor, setTickedFor] = useState<{ date: string; ids: Set<string> } | null>(null);

  const dates = [...selected].sort();
  const key = dates.join(",");
  const groups = groupDates(dates);
  const singleDate = dates.length === 1 ? dates[0] : null;
  const choosingSlots = scope === "slots" && singleDate !== null;
  const daySlots = loaded && loaded.date === singleDate ? loaded.slots : null;
  const pendingConflicts = conflicts.filter((c) => c.status === "pending").length;
  const confirmedConflicts = conflicts.length - pendingConflicts;
  const pendingHere = conflicts.filter((c) => c.date === singleDate && c.status === "pending");
  const ticked = tickedFor && tickedFor.date === singleDate ? tickedFor.ids : new Set<string>();

  useEffect(() => {
    let cancelled = false;
    getConflictsAction(practitionerSlug, key ? key.split(",") : []).then((result) => {
      if (!cancelled) setConflicts(result);
    });
    return () => {
      cancelled = true;
    };
  }, [key, practitionerSlug]);

  useEffect(() => {
    let cancelled = false;
    getUnavailableDatesAction(practitionerSlug).then((result) => {
      if (cancelled) return;
      const blocked = new Set(result);
      setAlreadyUnavailable(blocked);
      // Drop any preselected date that's already unavailable.
      setSelected((current) => new Set([...current].filter((d) => !blocked.has(d))));
    });
    return () => {
      cancelled = true;
    };
  }, [practitionerSlug]);

  useEffect(() => {
    if (!singleDate) return;
    let cancelled = false;
    getSlotsForDateAction(practitionerSlug, singleDate).then((slots) => {
      if (!cancelled) setLoaded({ date: singleDate, slots });
    });
    return () => {
      cancelled = true;
    };
  }, [singleDate, practitionerSlug]);

  function toggleSlot(id: string) {
    if (!singleDate) return;
    const next = new Set(ticked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setTickedFor({ date: singleDate, ids: next });
  }

  function handlePick(date: string) {
    if (alreadyUnavailable.has(date)) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function removeGroup(group: Group) {
    setSelected((current) => {
      const next = new Set(current);
      for (const d of group.dates) next.delete(d);
      return next;
    });
  }

  async function handleConfirm() {
    if (choosingSlots) {
      if (ticked.size === 0) return;
      setPending(true);
      await markSlotsUnavailableAction(practitionerSlug, singleDate, [...ticked]);
      setPending(false);
      onClose();
      return;
    }
    if (dates.length === 0) return;
    setPending(true);
    const formData = new FormData();
    formData.set("slug", practitionerSlug);
    for (const date of dates) formData.append("dates", date);
    await markDatesUnavailableAction(formData);
    setPending(false);
    onClose();
  }

  return (
    <SidePanel title="Mark dates unavailable" subtitle="Pick one or more days, or a single day to choose slots." variant="modal" onClose={onClose}>
      <div className="flex-1 space-y-6 overflow-y-auto px-7 py-4">
        <section className="space-y-3">
          <p className="text-sm text-muted">
            Click days to add or remove them. Dates that are already unavailable are crossed out.
          </p>
          <MultiDateCalendar selectedDates={selected} onToggle={handlePick} disabledDates={alreadyUnavailable} />
        </section>

        <section>
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-sm font-medium text-muted">Selected</h3>
            <span className="text-sm text-muted">
              {dates.length} {dates.length === 1 ? "day" : "days"}
            </span>
          </div>
          {groups.length === 0 ? (
            <p className="pt-3 text-sm text-muted">No dates selected.</p>
          ) : (
            <ul className="divide-y divide-border">
              {groups.map((group) => (
                <li key={group.dates[0]} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm font-semibold">
                    {groupLabel(group)}{" "}
                    <span className="font-normal text-muted">
                      · {group.dates.length} {group.dates.length === 1 ? "day" : "days"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeGroup(group)}
                    aria-label={`Remove ${groupLabel(group)}`}
                    className="flex size-11 items-center justify-center rounded-full text-muted transition hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {singleDate && (
          <section className="space-y-3">
            <div role="radiogroup" aria-label="What to block" className="grid grid-cols-2 gap-1 rounded-xl bg-foreground/[0.05] p-1">
              {(["day", "slots"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={scope === value}
                  onClick={() => setScope(value)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    scope === value ? "bg-surface text-foreground shadow-sm ring-1 ring-black/[0.06]" : "text-muted hover:text-foreground"
                  }`}
                >
                  {value === "day" ? "Whole day" : "Specific slots"}
                </button>
              ))}
            </div>

            {choosingSlots &&
              (daySlots === null ? (
                <p className="text-sm text-muted">Loading slots…</p>
              ) : daySlots.length === 0 ? (
                <p className="text-sm text-muted">There are no slots on this day.</p>
              ) : (
                <ul className="divide-y divide-border rounded-xl ring-1 ring-border">
                  {daySlots.map((slot) => {
                    const open = slot.status === "open";
                    const requested =
                      slot.status === "booked" && conflicts.some((c) => c.date === slot.date && c.startTime === slot.startTime && c.status === "pending");
                    return (
                      <li key={slot.id}>
                        <label className={`flex items-center gap-3 px-4 py-3 ${open ? "cursor-pointer hover:bg-foreground/[0.03]" : "opacity-60"}`}>
                          <input
                            type="checkbox"
                            checked={ticked.has(slot.id)}
                            disabled={!open}
                            onChange={() => toggleSlot(slot.id)}
                            className="size-4 accent-[var(--color-primary)]"
                          />
                          <span className="flex-1 text-sm font-semibold tabular-nums">
                            {formatTime12h(slot.startTime)} – {formatTime12h(slot.endTime)}
                          </span>
                          <span className="text-sm text-muted">
                            {requested ? "Requested" : slot.status === "booked" ? "Booked" : slot.status === "unavailable" ? "Blocked" : sessionTypeLabel(slot.sessionType)}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ))}
            {choosingSlots && pendingHere.length > 0 && (
              <p className="text-sm text-muted">
                {pendingHere.length === 1 ? `${pendingHere[0].clientName} has` : `${pendingHere.length} clients have`} asked for a time marked Requested.
                To free it, decline the request on the{" "}
                <Link href="/dashboard/requests" className="font-semibold text-primary hover:underline">
                  Appointment Requests page
                </Link>
                .
              </p>
            )}
          </section>
        )}

        {!choosingSlots && conflicts.length > 0 && (
          <section className="flex items-start gap-3 rounded-xl bg-foreground/[0.05] px-4 py-4 ring-1 ring-border">
            <Info className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                {[
                  confirmedConflicts > 0 && `${confirmedConflicts} booked ${confirmedConflicts === 1 ? "session" : "sessions"}`,
                  pendingConflicts > 0 && `${pendingConflicts} pending ${pendingConflicts === 1 ? "request" : "requests"}`,
                ]
                  .filter(Boolean)
                  .join(" and ")}{" "}
                {conflicts.length === 1 ? "stays as it is" : "stay as they are"}
              </p>
              <ul className="space-y-0.5 text-sm text-muted">
                {conflicts.map((c) => {
                  const cell = formatDayCell(c.date);
                  return (
                    <li key={`${c.date}-${c.startTime}-${c.clientName}`}>
                      {cell.day} {cell.month}, {formatTime12h(c.startTime)} · {c.clientName}
                      {c.status === "pending" ? " · Requested" : ""}
                    </li>
                  );
                })}
              </ul>
              <p className="text-sm text-muted">
                Only open slots are blocked.{" "}
                {confirmedConflicts > 0 && (
                  <>
                    Reschedule or cancel booked sessions on the{" "}
                    <Link href="/dashboard/sessions" className="font-semibold text-primary hover:underline">
                      Sessions page
                    </Link>
                    .{" "}
                  </>
                )}
                {pendingConflicts > 0 && (
                  <>
                    Decline a pending request on the{" "}
                    <Link href="/dashboard/requests" className="font-semibold text-primary hover:underline">
                      Appointment Requests page
                    </Link>{" "}
                    to free its slot.
                  </>
                )}
              </p>
            </div>
          </section>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-7 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted transition hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending || (choosingSlots ? ticked.size === 0 : dates.length === 0)}
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-surface transition hover:opacity-90 disabled:opacity-50"
        >
          {pending
            ? "Saving…"
            : choosingSlots
              ? `Block ${ticked.size || ""} ${ticked.size === 1 ? "slot" : "slots"}`
              : `Mark ${dates.length || ""} ${dates.length === 1 ? "day" : "days"} unavailable`}
        </button>
      </div>
    </SidePanel>
  );
}
