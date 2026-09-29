"use client";

import { Calendar, CalendarPlus, Clock, MapPin, MessageSquare, Phone, Video, X } from "lucide-react";
import { formatDateFull, formatDateTime, formatTime12h } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Appointment } from "@/types/appointment";

const rowClass = "flex items-start gap-3 px-6 py-4";
const labelClass = "text-xs font-semibold tracking-[0.06em] text-muted uppercase";

export function AppointmentDetailModal({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const SessionIcon = appointment.sessionType === "online" ? Video : MapPin;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-surface shadow-2xl ring-1 ring-border">
        <div className="flex items-center justify-between border-b border-border px-8 py-7">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{appointment.clientName}</h2>
            <div className="mt-1.5">
              <StatusBadge status={appointment.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-foreground/[0.05] hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="max-h-[65vh] divide-y divide-border overflow-y-auto">
          <div className={rowClass}>
            <Calendar className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <div>
              <p className={labelClass}>Date</p>
              <p className="mt-0.5 text-sm font-medium">{formatDateFull(appointment.date)}</p>
            </div>
          </div>

          <div className={rowClass}>
            <Clock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <div>
              <p className={labelClass}>Time</p>
              <p className="mt-0.5 text-sm font-medium">
                {formatTime12h(appointment.startTime)} – {formatTime12h(appointment.endTime)}
              </p>
            </div>
          </div>

          <div className={rowClass}>
            <SessionIcon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <div>
              <p className={labelClass}>Session type</p>
              <p className="mt-0.5 text-sm font-medium capitalize">
                {appointment.sessionType === "online" ? "Online" : "On-Site"}
              </p>
            </div>
          </div>

          <div className={rowClass}>
            <Phone className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <div>
              <p className={labelClass}>Contact</p>
              <p className="mt-0.5 text-sm font-medium">{appointment.clientContact}</p>
            </div>
          </div>

          <div className={rowClass}>
            <CalendarPlus className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <div>
              <p className={labelClass}>Requested on</p>
              <p className="mt-0.5 text-sm font-medium">{formatDateTime(appointment.createdAt)}</p>
            </div>
          </div>

          <div className={rowClass}>
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
            <div>
              <p className={labelClass}>Client&apos;s message</p>
              {appointment.concern ? (
                <p className="mt-0.5 text-sm leading-relaxed text-foreground/85">{appointment.concern}</p>
              ) : (
                <p className="mt-0.5 text-sm text-muted">No message was left with this request.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border px-8 py-6">
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-full px-6 py-3 text-sm font-medium text-muted ring-1 ring-border transition hover:bg-foreground/[0.05]"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
