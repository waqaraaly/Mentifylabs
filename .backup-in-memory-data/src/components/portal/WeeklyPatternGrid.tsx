"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { formatRange12h } from "@/lib/format";
import type { WeeklyRule } from "@/types/availability";
import { WeeklyDayPopup } from "./WeeklyDayPopup";
import { sessionTypeLabel } from "@/lib/sessionType";

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

type PopupState = { weekday: number; rule?: WeeklyRule };

export function WeeklyPatternGrid({
  weeklyRules,
  practitionerSlug,
}: {
  weeklyRules: WeeklyRule[];
  practitionerSlug: string;
}) {
  const [popup, setPopup] = useState<PopupState | null>(null);

  const rulesByWeekday = new Map<number, WeeklyRule[]>();
  for (const rule of weeklyRules) {
    const bucket = rulesByWeekday.get(rule.weekday);
    if (bucket) bucket.push(rule);
    else rulesByWeekday.set(rule.weekday, [rule]);
  }

  return (
    <>
      <ul className="divide-y divide-border">
        {WEEKDAY_ORDER.map((weekday) => {
          const rules = (rulesByWeekday.get(weekday) ?? [])
            .slice()
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          const active = rules.length > 0;

          return (
            <li
              key={weekday}
              className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-start sm:gap-6"
            >
              <div className="w-full shrink-0 sm:w-40 sm:pt-1.5">
                <p className={`text-sm font-semibold ${active ? "text-foreground" : "text-muted"}`}>
                  {WEEKDAY_LABELS[weekday]}
                </p>
                {!active && <p className="text-xs text-muted">Day off</p>}
              </div>

              <div className="flex flex-1 flex-wrap items-center gap-2">
                {rules.map((rule) => (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => setPopup({ weekday, rule })}
                    className="inline-flex items-baseline gap-2 rounded-lg bg-foreground/[0.04] px-3.5 py-2 text-[14px] whitespace-nowrap ring-1 ring-inset ring-border transition hover:bg-foreground/[0.07] hover:ring-foreground/25"
                  >
                    <span className="font-semibold tabular-nums">{formatRange12h(rule.startTime, rule.endTime)}</span>
                    <span className="text-[13px] text-muted">{sessionTypeLabel(rule.sessionType)}</span>
                  </button>
                ))}
              </div>

              <div className="shrink-0 sm:pt-0.5">
                <button
                  type="button"
                  onClick={() => setPopup({ weekday })}
                  aria-label={`Add slot to ${WEEKDAY_LABELS[weekday]}`}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-muted ring-1 ring-dashed ring-foreground/25 transition hover:bg-foreground/[0.05] hover:text-foreground"
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {popup && (
        <WeeklyDayPopup
          weekday={popup.weekday}
          rule={popup.rule}
          practitionerSlug={practitionerSlug}
          onClose={() => setPopup(null)}
        />
      )}
    </>
  );
}
