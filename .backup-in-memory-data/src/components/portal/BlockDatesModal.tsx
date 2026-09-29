"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";
import { addDays, formatDayCell, formatTime12h } from "@/lib/format";
import { getConflictsAction, getUnavailableDatesAction, markDatesUnavailableAction } from "@/app/dashboard/slots/actions";
import { MultiDateCalendar } from "./MultiDateCalendar";
import { SidePanel } from "./SidePanel";

type Conflict = { date: string; startTime: string; clientName: string };
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

/** Pick one or more dates and mark them all unavailable at once. */
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

  const dates = [...selected].sort();
  const key = dates.join(",");
  const groups = groupDates(dates);

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
    <SidePanel title="Mark dates unavailable" subtitle="Pick one or more days." variant="modal" onClose={onClose}>
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
                    className="flex size-7 items-center justify-center rounded-full text-muted transition hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {conflicts.length > 0 && (
          <section className="flex items-start gap-3 rounded-xl bg-foreground/[0.05] px-4 py-4 ring-1 ring-border">
            <Info className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                {conflicts.length} booked {conflicts.length === 1 ? "session" : "sessions"} won&apos;t be cancelled
              </p>
              <ul className="space-y-0.5 text-sm text-muted">
                {conflicts.map((c) => {
                  const cell = formatDayCell(c.date);
                  return (
                    <li key={`${c.date}-${c.startTime}-${c.clientName}`}>
                      {cell.day} {cell.month}, {formatTime12h(c.startTime)} · {c.clientName}
                    </li>
                  );
                })}
              </ul>
              <p className="text-sm text-muted">
                Only open slots are blocked. Reschedule or cancel these sessions from the{" "}
                <Link href="/dashboard/sessions" className="font-semibold text-primary hover:underline">
                  Sessions page
                </Link>
                .
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
          disabled={pending || dates.length === 0}
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-surface transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : `Mark ${dates.length || ""} ${dates.length === 1 ? "day" : "days"} unavailable`}
        </button>
      </div>
    </SidePanel>
  );
}
