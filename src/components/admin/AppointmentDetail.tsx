import Link from "next/link";
import { ArrowLeft, ArrowUpRight, MapPin, Video, CalendarClock, Stethoscope, Ticket, Route } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Practitioner } from "@/types/practitioner";
import { Badge } from "./ui/Badge";
import { Section, Row, SummaryItem } from "./ui/Detail";
import { STATE_STEP } from "./ui/bookingState";

const BACK_HREF = "/admin/bookings";

/** The full page for one booking: the same content as the side drawer, laid out in two columns. Leaves out the client on purpose. */
export function AppointmentDetail({ b, practitioner, today }: { b: Appointment; practitioner: Practitioner | null; today?: string }) {
  const online = b.sessionType === "online";
  const bookedOn = b.createdAt.slice(0, 16).replace("T", " ");
  const step = STATE_STEP[b.status];
  const overdue = !!today && b.status === "pending" && b.date < today;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Link className="btn btn-ghost btn-sm" href={BACK_HREF} style={{ marginLeft: -10 }}><ArrowLeft size={14} />All appointments</Link>
      </div>

      {/* Headline + at-a-glance summary */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: 24, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div className="kpi-icon" style={{ width: 56, height: 56, borderRadius: 16 }}>
            {online ? <Video size={24} /> : <MapPin size={24} />}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>{online ? "Online session" : "On-Site session"}</h2>
            <div className="tnum" style={{ color: "var(--ml-ink-muted)", fontSize: 14, marginTop: 4 }}>
              {b.date} · {b.startTime}–{b.endTime}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <Badge kind={b.status} />
              {overdue && <Badge kind="cancelled" dot={false}>Overdue</Badge>}
              <span style={{ fontSize: 12.5, color: "var(--ml-ink-subtle)" }}>{step.label}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", borderTop: "1px solid var(--ml-border-soft)", background: "var(--ml-surface-2)" }}>
          <SummaryItem label="Date" value={b.date} />
          <SummaryItem label="Time" value={`${b.startTime}–${b.endTime}`} />
          <SummaryItem label="Practitioner" value={practitioner?.fullName ?? b.practitionerSlug} />
          <SummaryItem label="Received" value={bookedOn} />
        </div>
      </div>

      <div className="detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Section icon={<CalendarClock size={15} />} title="Session">
            <Row label="Status"><Badge kind={b.status} /></Row>
            <Row label="Date"><span className="tnum">{b.date}</span></Row>
            <Row label="Time"><span className="tnum">{b.startTime}–{b.endTime}</span></Row>
            <Row label="Session mode">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {online ? <Video size={13} /> : <MapPin size={13} />}
                {online ? "Online (video call)" : "On-Site"}
              </span>
            </Row>
          </Section>

          <Section icon={<Ticket size={15} />} title="Booking">
            <Row label="Booking ID"><span className="mono" style={{ fontSize: 13 }}>{b.id}</span></Row>
            <Row label="Received"><span className="tnum">{bookedOn}</span></Row>
          </Section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Section icon={<Stethoscope size={15} />} title="Practitioner">
            {practitioner ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }} className="truncate">{practitioner.fullName}</div>
                  <div className="truncate" style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", marginTop: 2 }}>{practitioner.professionalTitle}</div>
                </div>
                <Link className="btn btn-sm" href={`/admin/practitioners/${practitioner.slug}`}>
                  Open profile<ArrowUpRight size={12} />
                </Link>
              </div>
            ) : (
              <div style={{ padding: "12px 0", fontSize: 13 }} className="subtle">This practitioner is no longer on the platform.</div>
            )}
          </Section>

          <Section icon={<Route size={15} />} title="Progress">
            <ol className="timeline" style={{ margin: "16px 0 8px" }}>
              <li>
                <span className="timeline-dot" style={{ background: "var(--ml-accent)" }} />
                <div style={{ fontSize: 13.5 }}>Booking received</div>
                <div className="tnum" style={{ fontSize: 12, color: "var(--ml-ink-subtle)" }}>{bookedOn}</div>
              </li>
              <li>
                <span className="timeline-dot" style={{ background: step.tone }} />
                <div style={{ fontSize: 13.5 }}>{step.label}</div>
              </li>
            </ol>
          </Section>
        </div>
      </div>
    </div>
  );
}
