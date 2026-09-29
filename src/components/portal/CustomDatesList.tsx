"use client";

import { formatDayCell, formatTime12h } from "@/lib/format";
import type { DayOverride } from "@/types/availability";
import type { Slot } from "@/types/slot";

function summarize(override: DayOverride, slots: Slot[]): string {
  const booked = slots.filter((s) => s.status === "booked").length;
  const bookedNote = booked > 0 ? ` · ${booked} booked` : "";

  if (override.type === "unavailable") return `Unavailable all day${bookedNote}`;
  if (slots.length === 0) return "Custom hours · No slots";

  const first = slots[0];
  const last = slots[slots.length - 1];
  return `${slots.length} ${slots.length === 1 ? "slot" : "slots"} · ${formatTime12h(first.startTime)} – ${formatTime12h(last.endTime)}${bookedNote}`;
}

export function CustomDatesList({
  customDates,
  slotsByDate,
  onManageDate,
}: {
  customDates: DayOverride[];
  slotsByDate: Record<string, Slot[]>;
  onManageDate: (date: string) => void;
}) {
  if (customDates.length === 0) {
    return (
      <p className="px-6 py-8 text-sm text-muted">
        No special dates yet. Use Add availability or Mark unavailable above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {customDates.map((override) => {
        const cell = formatDayCell(override.date);

        return (
          <li key={override.id} className="flex items-center gap-4 px-6 py-3.5">
            <button
              type="button"
              onClick={() => onManageDate(override.date)}
              className="flex min-w-0 flex-1 items-center gap-4 rounded-lg text-left transition hover:opacity-80"
            >
              <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-foreground/[0.05] leading-none ring-1 ring-border">
                <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">{cell.month}</span>
                <span className="mt-0.5 text-base font-bold">{cell.day}</span>
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-semibold">{cell.weekday}</span>
                <span className="block truncate text-xs font-medium text-muted">
                  {summarize(override, slotsByDate[override.date] ?? [])}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onManageDate(override.date)}
              className="shrink-0 rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border transition hover:bg-foreground/[0.05]"
            >
              Manage
            </button>
          </li>
        );
      })}
    </ul>
  );
}
