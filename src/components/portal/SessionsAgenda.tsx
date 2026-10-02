"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Check, Eye, MoreHorizontal, CalendarClock, Search, Trash2, X } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Slot } from "@/types/slot";
import { formatDate, formatDayCell, formatTime12h } from "@/lib/format";
import { cancelAppointment, completeAppointment, deleteAppointmentAction } from "@/app/dashboard/sessions/actions";
import { RescheduleModal } from "./RescheduleModal";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { Tabs } from "@/components/ui/Tabs";

const EMPTY_COPY: Record<string, { title: string; body: string }> = {
  upcoming: {
    title: "Nothing scheduled",
    body: "Approved sessions will show up here once clients are booked in.",
  },
  completed: {
    title: "No completed sessions yet",
    body: "Sessions move here automatically once their scheduled time has passed.",
  },
  cancelled: {
    title: "No cancelled sessions",
    body: "Cancelled or declined bookings will be listed here for your records.",
  },
};

function RowMenu({
  open,
  onToggle,
  onClose,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, right: 0 });

  const handleToggle = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    onToggle();
  };

  return (
    <div className="inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-label="Session actions"
        aria-expanded={open}
        className="flex size-11 items-center justify-center rounded-full text-muted transition hover:bg-black/[0.05] hover:text-foreground"
      >
        <MoreHorizontal className="size-4.5" aria-hidden />
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
              style={{ top: coords.top, right: coords.right }}
              className="fixed z-50 w-48 overflow-hidden rounded-xl bg-surface py-1.5 shadow-xl ring-1 ring-black/[0.08]"
            >
              {children}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

function SessionActionsMenu({
  open,
  onToggle,
  onClose,
  onView,
  onReschedule,
  onRequestComplete,
  onRequestCancel,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onView: () => void;
  onReschedule: () => void;
  onRequestComplete: () => void;
  onRequestCancel: () => void;
}) {
  return (
    <RowMenu open={open} onToggle={onToggle} onClose={onClose}>
      <button
        type="button"
        onClick={() => {
          onClose();
          onView();
        }}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-black/[0.035]"
      >
        <Eye className="size-4 text-muted" aria-hidden />
        View
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onRequestComplete();
        }}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-black/[0.035]"
      >
        <Check className="size-4 text-success" aria-hidden />
        Mark as completed
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onReschedule();
        }}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-black/[0.035]"
      >
        <CalendarClock className="size-4 text-primary" aria-hidden />
        Reschedule
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onRequestCancel();
        }}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-alert transition hover:bg-alert/[0.06]"
      >
        <X className="size-4" aria-hidden />
        Cancel
      </button>
    </RowMenu>
  );
}

function DeleteRecordMenu({
  appointment,
  practitionerSlug,
  open,
  onToggle,
  onClose,
}: {
  appointment: Appointment;
  practitionerSlug: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <RowMenu open={open} onToggle={onToggle} onClose={onClose}>
      <form action={deleteAppointmentAction} onSubmit={onClose}>
        <input type="hidden" name="id" value={appointment.id} />
        <input type="hidden" name="slug" value={practitionerSlug} />
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-alert transition hover:bg-alert/[0.06]"
        >
          <Trash2 className="size-4" aria-hidden />
          Delete Record
        </button>
      </form>
    </RowMenu>
  );
}

export function SessionsAgenda({
  appointments,
  tab,
  practitionerSlug,
  openSlots,
  tabItems,
}: {
  appointments: Appointment[];
  tab: string;
  practitionerSlug: string;
  openSlots: Slot[];
  tabItems: { value: string; label: string; count?: number }[];
}) {
  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ appointment: Appointment; action: "complete" | "cancel" } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const runConfirmedAction = () => {
    if (!confirmTarget) return;
    const { appointment, action } = confirmTarget;
    const formData = new FormData();
    formData.set("id", appointment.id);
    formData.set("slug", practitionerSlug);
    startTransition(async () => {
      await (action === "complete" ? completeAppointment : cancelAppointment)(formData);
      setConfirmTarget(null);
      router.refresh();
    });
  };

  const filtered = appointments.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return a.clientName.toLowerCase().includes(q) || a.clientContact.toLowerCase().includes(q);
  });

  const now = new Date();
  const hasEnded = (a: Appointment) => new Date(`${a.date}T${a.endTime}:00`) < now;

  // Upcoming: soonest session first — anything whose end time has already passed (stale
  // "confirmed" data) sinks below everything that's actually still ahead of us.
  const rows =
    tab === "upcoming"
      ? [...filtered].sort((a, b) => {
          const aPast = hasEnded(a) ? 1 : 0;
          const bPast = hasEnded(b) ? 1 : 0;
          if (aPast !== bPast) return aPast - bPast;
          return (a.date + a.startTime).localeCompare(b.date + b.startTime);
        })
      : [...filtered].reverse();

  const rescheduleTarget = appointments.find((a) => a.id === rescheduleId) ?? null;
  const viewTarget = appointments.find((a) => a.id === viewId) ?? null;

  const top = <Tabs basePath="/dashboard/sessions" active={tab} items={tabItems} />;

  if (appointments.length === 0) {
    const copy = EMPTY_COPY[tab] ?? EMPTY_COPY.upcoming;
    return (
      <div className="space-y-6">
        {top}
        <div className="rounded-2xl bg-surface py-16 text-center ring-1 ring-black/[0.07]">
          <p className="font-medium">{copy.title}</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">{copy.body}</p>
        </div>
        {viewTarget && <AppointmentDetailModal appointment={viewTarget} onClose={() => setViewId(null)} />}
        {rescheduleTarget && (
          <RescheduleModal
            appointment={rescheduleTarget}
            practitionerSlug={practitionerSlug}
            openSlots={openSlots}
            onClose={() => setRescheduleId(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {top}
      <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-black/[0.07]">
        <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.07] px-6 py-4.5 sm:px-7">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sessions"
              className="w-full rounded-full bg-black/[0.03] py-2.5 pr-4 pl-9 text-base outline-none ring-1 ring-transparent transition focus:bg-surface focus:ring-primary/30"
            />
          </div>
          <span className="ml-auto text-sm text-muted">
            {filtered.length} of {appointments.length}
          </span>
        </div>

        <div className="themed-scrollbar max-h-[28rem] overflow-auto">
          <table className="w-full min-w-[760px] text-left text-base">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-black/[0.07] bg-surface">
                <th className="px-4 py-4 pl-6 text-xs font-semibold tracking-[0.08em] text-foreground/55 uppercase sm:pl-7">
                  Date &amp; Time
                </th>
                <th className="px-4 py-4 text-xs font-semibold tracking-[0.08em] text-foreground/55 uppercase">
                  Client
                </th>
                <th className="px-4 py-4 text-xs font-semibold tracking-[0.08em] text-foreground/55 uppercase">
                  Mode
                </th>
                <th className="py-4 pr-6 text-right text-xs font-semibold tracking-[0.08em] text-foreground/55 uppercase sm:pr-7">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-base text-muted">
                    No sessions match &ldquo;{search}&rdquo;.
                  </td>
                </tr>
              ) : (
                rows.map((a) => {
                  const overdue = tab === "upcoming" && hasEnded(a);
                  return (
                  <tr key={a.id} className="transition hover:bg-black/[0.02]">
                    <td className="px-4 py-4 pl-6 whitespace-nowrap sm:pl-7">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`flex w-16 shrink-0 flex-col items-center rounded-xl py-2.5 ${
                            overdue ? "bg-alert/[0.08] text-alert" : "bg-primary/[0.08] text-primary"
                          }`}
                        >
                          <span className="text-[10px] font-semibold tracking-[0.08em] uppercase">
                            {formatDayCell(a.date).weekday}
                          </span>
                          <span className="text-xl leading-tight font-semibold tabular-nums">
                            {formatDayCell(a.date).day}
                          </span>
                          <span className="text-[10px] font-medium uppercase opacity-80">{formatDayCell(a.date).month}</span>
                        </div>
                        <div>
                          <p className="font-semibold tabular-nums">
                            {formatTime12h(a.startTime)} – {formatTime12h(a.endTime)}
                          </p>
                          {overdue && (
                            <span className="mt-1 inline-block rounded-full bg-alert/10 px-2 py-0.5 text-[11px] font-semibold tracking-[0.04em] text-alert uppercase">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-base font-semibold tracking-tight">{a.clientName}</p>
                      <p className="mt-1 text-[15px] text-muted">{a.clientContact}</p>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                          a.sessionType === "online"
                            ? "bg-amber-500/[0.16] text-amber-800 dark:text-amber-300"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <span>{a.sessionType === "online" ? "Online" : "On-Site"}</span>
                      </span>
                    </td>
                    <td className="py-5 pr-6 sm:pr-7">
                      <div className="flex items-center justify-end">
                        {tab === "upcoming" ? (
                          <SessionActionsMenu
                            open={menuOpenId === a.id}
                            onToggle={() => setMenuOpenId(menuOpenId === a.id ? null : a.id)}
                            onClose={() => setMenuOpenId(null)}
                            onView={() => setViewId(a.id)}
                            onReschedule={() => setRescheduleId(a.id)}
                            onRequestComplete={() => setConfirmTarget({ appointment: a, action: "complete" })}
                            onRequestCancel={() => setConfirmTarget({ appointment: a, action: "cancel" })}
                          />
                        ) : (
                          <DeleteRecordMenu
                            appointment={a}
                            practitionerSlug={practitionerSlug}
                            open={menuOpenId === a.id}
                            onToggle={() => setMenuOpenId(menuOpenId === a.id ? null : a.id)}
                            onClose={() => setMenuOpenId(null)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewTarget && <AppointmentDetailModal appointment={viewTarget} onClose={() => setViewId(null)} />}

      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          practitionerSlug={practitionerSlug}
          openSlots={openSlots}
          onClose={() => setRescheduleId(null)}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title={
            confirmTarget.action === "complete"
              ? "Mark this session as completed?"
              : "Cancel this session?"
          }
          description={
            confirmTarget.action === "complete" ? (
              <>
                {confirmTarget.appointment.clientName}&apos;s session on {formatDate(confirmTarget.appointment.date)},{" "}
                {confirmTarget.appointment.startTime}–{confirmTarget.appointment.endTime} will be marked completed.
              </>
            ) : (
              "Are you sure you want to cancel?"
            )
          }
          confirmLabel={confirmTarget.action === "complete" ? "Yes, mark completed" : "Yes, cancel it"}
          tone={confirmTarget.action === "cancel" ? "danger" : "default"}
          pending={pending}
          onConfirm={runConfirmedAction}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}
