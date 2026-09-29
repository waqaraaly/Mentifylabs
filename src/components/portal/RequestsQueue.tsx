"use client";

import { useState } from "react";
import { Check, Inbox } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Slot } from "@/types/slot";
import { daysBetween, formatDayCell, formatTime12h, todayIsoDate } from "@/lib/format";
import { approveAppointment } from "@/app/dashboard/sessions/actions";
import { RequestDetailModal } from "./RequestDetailModal";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function waitingLabel(createdAt: string, today: string): string {
  const days = daysBetween(createdAt.slice(0, 10), today);
  if (days <= 0) return "Received today";
  return `Waiting ${days}d`;
}

function sessionWhen(a: Appointment, today: string, nowMinutes: number): { text: string; expired: boolean } {
  const diff = daysBetween(today, a.date);
  if (diff < 0 || (diff === 0 && toMinutes(a.endTime) <= nowMinutes)) return { text: "Slot has passed", expired: true };
  if (diff === 0) return { text: "Today", expired: false };
  if (diff === 1) return { text: "Tomorrow", expired: false };
  return { text: `In ${diff} days`, expired: false };
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
  const openDetail = requests.find((r) => r.id === openId) ?? null;

  const today = todayIsoDate();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface px-6 py-24 text-center ring-1 ring-black/[0.07]">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/[0.1] text-primary">
          <Inbox className="size-5" aria-hidden />
        </div>
        <p className="text-lg font-semibold tracking-tight">You&apos;re all caught up</p>
        <p className="max-w-xs text-sm text-muted">
          No new requests right now. When a client asks to book you, it&apos;ll appear here first.
        </p>
      </div>
    );
  }

  const approve = (id: string, className: string, label: string) => (
    <form>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={practitionerSlug} />
      <button type="submit" formAction={approveAppointment} className={className}>
        <Check className="size-4" aria-hidden />
        {label}
      </button>
    </form>
  );

  return (
    <>
      {/* Queue */}
      <section className="rounded-2xl bg-surface ring-1 ring-black/[0.07]">
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4">
          <h2 className="text-base font-semibold tracking-tight">All requests</h2>
          <span className="text-xs text-muted">Soonest session first</span>
        </div>

        <ul className="themed-scrollbar max-h-[40rem] divide-y divide-black/[0.06] overflow-auto border-t border-black/[0.06]">
          {requests.map((r) => {
            const when = sessionWhen(r, today, nowMinutes);
            const cell = formatDayCell(r.date);
            const waited = daysBetween(r.createdAt.slice(0, 10), today);
            return (
              <li key={r.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:gap-6">
                {/* Requested-date tile */}
                <div
                  className={`flex w-16 shrink-0 flex-col items-center rounded-xl py-2.5 ${
                    when.expired ? "bg-alert/[0.08] text-alert" : "bg-primary/[0.08] text-primary"
                  }`}
                >
                  <span className="text-[10px] font-semibold tracking-[0.08em] uppercase">{cell.weekday}</span>
                  <span className="text-xl leading-tight font-semibold tabular-nums">{cell.day}</span>
                  <span className="text-[10px] font-medium uppercase opacity-80">{cell.month}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold tracking-tight">{r.clientName}</p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                        r.sessionType === "online" ? "bg-amber-500/[0.16] text-amber-800 dark:text-amber-300" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {r.sessionType === "online" ? "Online" : "On-Site"}
                    </span>
                    {when.expired && (
                      <span className="rounded-full bg-alert/10 px-2.5 py-0.5 text-xs font-semibold text-alert">
                        Slot passed
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[15px] text-muted tabular-nums" suppressHydrationWarning>
                    {formatTime12h(r.startTime)} – {formatTime12h(r.endTime)}
                    {!when.expired && ` · ${when.text}`}
                    <span className={waited >= 3 ? "text-alert" : ""}> · {waitingLabel(r.createdAt, today)}</span>
                  </p>
                  {r.concern && (
                    <p className="mt-2 line-clamp-2 max-w-prose text-[15px] leading-relaxed text-foreground/75">
                      &ldquo;{r.concern}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOpenId(r.id)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-black/[0.12] transition hover:bg-black/[0.04]"
                  >
                    View
                  </button>
                  {approve(
                    r.id,
                    "inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90",
                    "Accept",
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {openDetail && (
        <RequestDetailModal
          appointment={openDetail}
          practitionerSlug={practitionerSlug}
          openSlots={openSlots}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
