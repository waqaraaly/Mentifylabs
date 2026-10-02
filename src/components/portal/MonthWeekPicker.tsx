"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addMonths, formatDayCell, formatMonthLabel, mondayOf, monthOf, todayIsoDate } from "@/lib/format";

/** Mondays of every week that touches this month — what a practitioner picks a week by. */
function weeksOfMonth(monthIso: string): string[] {
  const [y, m] = monthIso.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const lastOfMonth = `${monthIso}-${String(lastDay).padStart(2, "0")}`;

  const weeks: string[] = [];
  let weekStart = mondayOf(`${monthIso}-01`);
  while (weekStart <= lastOfMonth) {
    weeks.push(weekStart);
    weekStart = addDays(weekStart, 7);
  }
  return weeks;
}

function weekRangeLabel(weekStart: string): string {
  const start = formatDayCell(weekStart);
  const end = formatDayCell(addDays(weekStart, 6));
  return start.month === end.month
    ? `${start.month} ${start.day}–${end.day}`
    : `${start.month} ${start.day} – ${end.month} ${end.day}`;
}

export function MonthWeekPicker({ selectedDate }: { selectedDate: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => monthOf(selectedDate));

  const currentWeekStart = mondayOf(selectedDate);
  const startCell = formatDayCell(currentWeekStart);
  const endCell = formatDayCell(addDays(currentWeekStart, 6));
  const dayRangeLabel =
    startCell.month === endCell.month
      ? `${startCell.day}–${endCell.day}`
      : `${startCell.month} ${startCell.day} – ${endCell.month} ${endCell.day}`;

  function toggle() {
    setOpen((v) => {
      const next = !v;
      if (next) setViewMonth(monthOf(selectedDate));
      return next;
    });
  }

  function selectWeek(weekStart: string) {
    setOpen(false);
    router.push(`/dashboard/slots?date=${weekStart}`);
  }

  const weeks = weeksOfMonth(viewMonth);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-border transition hover:bg-foreground/[0.05]"
      >
        <CalendarDays className="size-4" aria-hidden />
        Week of {dayRangeLabel}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                className="flex size-11 items-center justify-center rounded-full text-muted transition hover:bg-foreground/[0.05] hover:text-foreground"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <p className="text-sm font-semibold tracking-tight">{formatMonthLabel(viewMonth)}</p>
              <button
                type="button"
                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                className="flex size-11 items-center justify-center rounded-full text-muted transition hover:bg-foreground/[0.05] hover:text-foreground"
                aria-label="Next month"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>

            <div className="divide-y divide-border">
              {weeks.map((weekStart) => {
                const active = weekStart === currentWeekStart;
                const label = weekRangeLabel(weekStart);

                return (
                  <button
                    key={weekStart}
                    type="button"
                    onClick={() => selectWeek(weekStart)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-sm transition ${
                      active
                        ? "bg-primary font-semibold text-primary-foreground"
                        : "text-foreground/85 hover:bg-foreground/[0.05]"
                    }`}
                  >
                    <span>{label}</span>
                    {weekStart === mondayOf(todayIsoDate()) && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                          active ? "bg-white/20" : "bg-primary/10 text-primary"
                        }`}
                      >
                        This week
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
