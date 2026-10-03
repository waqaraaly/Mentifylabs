"use client";

import { useEffect, useRef, useState } from "react";
import type { Slot } from "@/types/slot";
import { sessionTypeLabel } from "@/lib/sessionType";
import { formatDate, isPastStart, todayIsoDate } from "@/lib/format";

const fieldClass =
  "w-full rounded-lg bg-black/[0.03] px-3 py-2.5 text-sm outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-primary/40";
const labelClass = "text-xs font-medium tracking-[0.06em] text-muted uppercase";

export function RescheduleFields({ openSlots: allOpenSlots }: { openSlots: Slot[] }) {
  // A session can't be moved to a time that has already gone by, so slots that have started aren't offered.
  const openSlots = allOpenSlots.filter((s) => !isPastStart(s.date, s.startTime));
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const past = !!date && (date < todayIsoDate() || (!!start && isPastStart(date, start)));
  const startRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    startRef.current?.setCustomValidity(past ? "That time has already passed." : "");
  }, [past]);

  return (
    <>
      {openSlots.length > 0 && (
        <>
          <div>
            <label htmlFor="reschedule-slot" className={labelClass}>
              Pick an open slot
            </label>
            <select id="reschedule-slot" name="slotId" className={`mt-2 ${fieldClass}`} defaultValue="">
              <option value="">— Select a slot —</option>
              {openSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {formatDate(slot.date)}, {slot.startTime}–{slot.endTime} ({sessionTypeLabel(slot.sessionType)})
                </option>
              ))}
            </select>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-black/[0.08]" />
            <span className="text-xs font-medium text-muted uppercase">Or</span>
            <div className="h-px flex-1 bg-black/[0.08]" />
          </div>
        </>
      )}

      <div className="space-y-3">
        <p className={labelClass}>Set a custom time</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="reschedule-date" className="text-xs text-muted">
              Date
            </label>
            <input
              id="reschedule-date"
              type="date"
              name="date"
              min={todayIsoDate()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`mt-1 ${fieldClass}`}
            />
          </div>
          <div>
            <label htmlFor="reschedule-mode" className="text-xs text-muted">
              Session mode
            </label>
            <select id="reschedule-mode" name="sessionType" defaultValue="online" className={`mt-1 ${fieldClass}`}>
              <option value="online">Online</option>
              <option value="offline">On-Site</option>
            </select>
          </div>
          <div>
            <label htmlFor="reschedule-start" className="text-xs text-muted">
              Start time
            </label>
            <input
              ref={startRef}
              id="reschedule-start"
              type="time"
              name="startTime"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={`mt-1 ${fieldClass}`}
            />
          </div>
          <div>
            <label htmlFor="reschedule-end" className="text-xs text-muted">
              End time
            </label>
            <input id="reschedule-end" type="time" name="endTime" className={`mt-1 ${fieldClass}`} />
          </div>
        </div>
        {past && <p className="text-xs text-alert">That time has already passed. Pick a date and time that are still ahead.</p>}
      </div>
    </>
  );
}
