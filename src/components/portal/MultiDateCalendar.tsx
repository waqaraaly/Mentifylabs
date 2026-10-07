"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePortalTimeZone } from "./PortalTimeZone";
import { addMonths, formatMonthLabel, getMonthGrid, monthOf, todayIsoDate } from "@/lib/format";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function MultiDateCalendar({
  selectedDates,
  onToggle,
  disabledDates,
}: {
  selectedDates: Set<string>;
  onToggle: (date: string) => void;
  /** Dates that can't be picked (shown greyed out and struck through). */
  disabledDates?: Set<string>;
}) {
  const zone = usePortalTimeZone();
  const today = todayIsoDate(zone);
  const [viewMonth, setViewMonth] = useState(() => monthOf(today));
  const weeks = getMonthGrid(viewMonth);

  return (
    <div className="rounded-xl ring-1 ring-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className="flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-foreground/[0.05] hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <p className="text-sm font-semibold tracking-tight">{formatMonthLabel(viewMonth)}</p>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="flex size-10 items-center justify-center rounded-full text-muted transition hover:bg-foreground/[0.05] hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 px-2 pt-2">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i} className="py-1 text-center text-[10px] font-medium text-muted">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-2">
        {weeks.flat().map((date, i) => {
          if (!date) return <div key={i} />;
          const day = Number(date.slice(-2));
          const blocked = disabledDates?.has(date) ?? false;
          const disabled = date < today || blocked;
          const selected = selectedDates.has(date);

          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(date)}
              className={`flex aspect-square items-center justify-center rounded-lg text-sm transition ${
                blocked
                  ? "text-muted/40 line-through"
                  : disabled
                  ? "text-muted/40"
                  : selected
                    ? "bg-primary font-semibold text-primary-foreground"
                    : date === today
                      ? "font-semibold text-primary ring-1 ring-inset ring-primary/40"
                      : "text-foreground/80 hover:bg-foreground/[0.05]"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
