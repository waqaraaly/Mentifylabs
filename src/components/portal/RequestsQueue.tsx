"use client";

import { Fragment, useState } from "react";
import { Inbox } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Slot } from "@/types/slot";
import { daysBetween, formatDayCell, formatDayHeading, formatTime12h, localDayOf } from "@/lib/format";
import { wallClockIn } from "@/lib/time";
import { approveAppointment } from "@/app/dashboard/sessions/actions";
import { RequestDetailModal } from "./RequestDetailModal";
import { usePortalTimeZone } from "./PortalTimeZone";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Whether the requested slot has already gone by, which the practitioner needs to know before accepting. */
function slotHasPassed(a: Appointment, today: string, nowMinutes: number): boolean {
  const diff = daysBetween(today, a.date);
  return diff < 0 || (diff === 0 && toMinutes(a.endTime) <= nowMinutes);
}

export function RequestsQueue({
  requests,
  practitionerSlug,
  openSlots,
}: {
  requests: Appointment[];
  practitionerSlug: string;
  openSlots: Slot[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [openView, setOpenView] = useState<"details" | "reschedule">("details");
  const open = (id: string, view: "details" | "reschedule") => {
    setOpenView(view);
    setOpenId(id);
  };
  const openDetail = requests.find((r) => r.id === openId) ?? null;

  // Everything here is on the practitioner's own clock, which the server and the browser both know, so they agree.
  const zone = usePortalTimeZone();
  const here = wallClockIn(zone);
  const today = here.date;
  const nowMinutes = here.minutes;

  const rows = [...requests].sort(
    (a, b) =>
      localDayOf(b.createdAt, zone).localeCompare(localDayOf(a.createdAt, zone)) ||
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime),
  );

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface px-6 py-24 text-center ring-1 ring-black/[0.07]">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/[0.1] text-primary">
          <Inbox className="size-5" aria-hidden />
        </div>
        <p className="text-lg font-semibold tracking-tight">You&apos;re all caught up</p>
        <p className="max-w-xs text-sm text-muted">
          No new requests right now.
        </p>
      </div>
    );
  }

  const approve = (id: string, className: string, label: string) => (
    <form>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={practitionerSlug} />
      <button type="submit" formAction={approveAppointment} className={className}>
        {label}
      </button>
    </form>
  );

  return (
    <>
      {/* Queue */}
      <section className="rounded-2xl bg-surface ring-1 ring-black/[0.07]">
        <ul className="themed-scrollbar max-h-[40rem] divide-y divide-black/[0.06] overflow-auto rounded-2xl">
          {rows.map((r, i) => {
            const passed = slotHasPassed(r, today, nowMinutes);
            const cell = formatDayCell(r.date);
            const day = localDayOf(r.createdAt, zone);
            const startsDay = i === 0 || day !== localDayOf(rows[i - 1].createdAt, zone);
            return (
              <Fragment key={r.id}>
                {startsDay && (
                  <li className="sticky top-0 z-10 bg-surface px-6 pt-4 pb-2 text-xs font-semibold tracking-[0.06em] text-muted uppercase">
                    Received {formatDayHeading(day, zone)}
                  </li>
                )}
              <li className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:gap-6">
                {/* Session-date tile */}
                <div
                  className={`flex w-16 shrink-0 flex-col items-center rounded-xl py-2.5 ${
                    passed ? "bg-alert/[0.08] text-alert" : "bg-primary/[0.08] text-primary"
                  }`}
                >
                  <span className="text-[10px] font-semibold tracking-[0.08em] uppercase">{cell.weekday}</span>
                  <span className="text-xl leading-tight font-semibold tabular-nums">{cell.day}</span>
                  <span className="text-[10px] font-medium uppercase opacity-80">{cell.month}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold tracking-tight">{r.clientName}</p>
                  </div>
                  <p className="mt-1 text-[15px] text-muted tabular-nums" suppressHydrationWarning>
                    {formatTime12h(r.startTime)} – {formatTime12h(r.endTime)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => open(r.id, "details")}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-black/[0.12] transition hover:bg-black/[0.04]"
                  >
                    View
                  </button>
                  {passed ? (
                    <button
                      type="button"
                      onClick={() => open(r.id, "reschedule")}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-accent-strong ring-1 ring-accent-strong/40 transition hover:bg-accent/50"
                    >
                      Reschedule
                    </button>
                  ) : (
                    approve(
                      r.id,
                      "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90",
                      "Accept",
                    )
                  )}
                </div>
              </li>
              </Fragment>
            );
          })}
        </ul>
      </section>

      {openDetail && (
        <RequestDetailModal
          appointment={openDetail}
          slotPassed={slotHasPassed(openDetail, today, nowMinutes)}
          initialView={openView}
          practitionerSlug={practitionerSlug}
          openSlots={openSlots}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
