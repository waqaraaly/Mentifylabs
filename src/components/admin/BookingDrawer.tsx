"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, ChevronUp, MapPin, Video, X } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Practitioner } from "@/types/practitioner";
import { Badge } from "./ui/Badge";
import { Row } from "./ui/Detail";
import { STATE_STEP } from "./ui/bookingState";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 style={{ margin: "0 0 2px", fontSize: 11.5, color: "var(--ml-ink-muted)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}


/**
 * One booking, in a panel beside the list so the list keeps its place. Up and down step
 * through the bookings currently in view. Deliberately leaves out the client: who they are
 * and what they wrote stay between them and their practitioner.
 */
export function BookingDrawer({
  appointment: b,
  practitioner,
  position,
  total,
  onPrev,
  onNext,
  onClose,
}: {
  appointment: Appointment | null;
  practitioner: Practitioner | null;
  position: number;
  total: number;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!b) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [b, onClose]);

  if (!b) return null;
  const online = b.sessionType === "online";
  const received = b.createdAt.slice(0, 16).replace("T", " ");
  const step = STATE_STEP[b.status];

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Appointment details">
        <div className="drawer-head">
          <div style={{ fontSize: 12.5, color: "var(--ml-ink-muted)" }} className="tnum">
            Booking {position} of {total}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={onPrev ?? undefined} disabled={!onPrev} aria-label="Previous booking"><ChevronUp size={15} /></button>
            <button className="btn btn-ghost btn-sm" onClick={onNext ?? undefined} disabled={!onNext} aria-label="Next booking"><ChevronDown size={15} /></button>
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={15} /></button>
          </div>
        </div>

        <div className="drawer-body">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="kpi-icon" style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0 }}>
              {online ? <Video size={22} /> : <MapPin size={22} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>{online ? "Online session" : "On-Site session"}</span>
                <Badge kind={b.status} />
              </div>
              <div className="tnum" style={{ color: "var(--ml-ink-muted)", fontSize: 13.5, marginTop: 3 }}>
                {b.date} · {b.startTime}–{b.endTime}
              </div>
            </div>
          </div>

          <Group title="Progress">
            <ol className="timeline">
              <li>
                <span className="timeline-dot" style={{ background: "var(--ml-accent)" }} />
                <div style={{ fontSize: 13.5 }}>Booking received</div>
                <div className="tnum" style={{ fontSize: 12, color: "var(--ml-ink-subtle)" }}>{received}</div>
              </li>
              <li>
                <span className="timeline-dot" style={{ background: step.tone }} />
                <div style={{ fontSize: 13.5 }}>{step.label}</div>
              </li>
            </ol>
          </Group>

          <Group title="Practitioner">
            {practitioner ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }} className="truncate">{practitioner.fullName}</div>
                  <div className="truncate" style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", marginTop: 2 }}>{practitioner.professionalTitle}</div>
                </div>
                <Link className="btn btn-sm" href={`/admin/practitioners/${practitioner.slug}`}>
                  Open profile<ArrowUpRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="subtle" style={{ padding: "10px 0", fontSize: 13 }}>This practitioner is no longer on the platform.</div>
            )}
          </Group>

          <Group title="Session">
            <Row label="Date"><span className="tnum">{b.date}</span></Row>
            <Row label="Time"><span className="tnum">{b.startTime}–{b.endTime}</span></Row>
            <Row label="Session mode">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {online ? <Video size={13} /> : <MapPin size={13} />}
                {online ? "Online (video call)" : "On-Site"}
              </span>
            </Row>
          </Group>

          <Group title="Booking">
            <Row label="Booking ID"><span className="mono" style={{ fontSize: 13 }}>{b.id}</span></Row>
            <Row label="Received"><span className="tnum">{received}</span></Row>
          </Group>
        </div>

        <div className="drawer-foot">
          <Link className="btn btn-sm" href={`/admin/bookings/${b.id}`}>Open full page<ArrowUpRight size={12} /></Link>
        </div>
      </aside>
    </>
  );
}
