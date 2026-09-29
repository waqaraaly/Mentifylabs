import Link from "next/link";
import { ArrowLeft, ExternalLink, MapPin, Video, UserRound, CalendarClock, Stethoscope, Ticket } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Practitioner } from "@/types/practitioner";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Section, Row, SummaryItem, dash, sectionGrid } from "./ui/Detail";

const BACK_HREF = "/admin/bookings";

export function AppointmentDetail({ b, practitioner }: { b: Appointment; practitioner: Practitioner | null }) {
  const online = b.sessionType === "online";
  const bookedOn = b.createdAt.slice(0, 16).replace("T", " ");

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
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 22, fontWeight: 650, letterSpacing: "-0.02em" }}>{online ? "Online session" : "Onsite session"}</h2>
              <Badge kind={b.status} />
            </div>
            <div className="tnum" style={{ color: "var(--ml-ink-muted)", fontSize: 14, marginTop: 4 }}>
              {b.date} · {b.startTime}–{b.endTime}
            </div>
            <div className="mono" style={{ color: "var(--ml-ink-subtle)", fontSize: 12, marginTop: 6 }}>{b.id}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", borderTop: "1px solid var(--ml-border-soft)", background: "var(--ml-surface-2)" }}>
          <SummaryItem label="Date" value={b.date} />
          <SummaryItem label="Time" value={`${b.startTime}–${b.endTime}`} />
          <SummaryItem label="Practitioner" value={practitioner?.fullName ?? b.practitionerSlug} />
          <SummaryItem label="Booked on" value={bookedOn} />
        </div>
      </div>

      <div style={sectionGrid}>
        <Section icon={<Stethoscope size={15} />} title="Practitioner">
          {practitioner ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
              <Avatar name={practitioner.fullName} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{practitioner.fullName}</div>
                <div style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", marginTop: 2 }}>{practitioner.professionalTitle}</div>
              </div>
              <Link className="btn btn-sm" href={`/admin/practitioners/${practitioner.slug}`}>
                Open profile<ExternalLink size={12} />
              </Link>
            </div>
          ) : (
            <div style={{ padding: "12px 0", fontSize: 13 }} className="subtle">This practitioner is no longer on the platform.</div>
          )}
        </Section>

        <Section icon={<UserRound size={15} />} title="Client">
          <Row label="Client ID"><span className="mono">{b.clientId}</span></Row>
          <Row label="Name">{b.clientName || dash}</Row>
          <Row label="Contact">{b.clientContact ? <span className="mono" style={{ fontSize: 13 }}>{b.clientContact}</span> : dash}</Row>
        </Section>

        <Section icon={<CalendarClock size={15} />} title="Session">
          <Row label="Status"><Badge kind={b.status} /></Row>
          <Row label="Date"><span className="mono tnum">{b.date}</span></Row>
          <Row label="Time"><span className="mono tnum">{b.startTime}–{b.endTime}</span></Row>
          <Row label="Session type">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {online ? <Video size={13} /> : <MapPin size={13} />}
              {online ? "Online (video call)" : "Onsite"}
            </span>
          </Row>
        </Section>

        <Section icon={<Ticket size={15} />} title="Booking">
          <Row label="Booking ID"><span className="mono" style={{ fontSize: 13 }}>{b.id}</span></Row>
          <Row label="Booked on"><span className="mono tnum">{bookedOn}</span></Row>
          <Row label="Concern">{b.concern ? <span style={{ lineHeight: 1.55 }}>{b.concern}</span> : dash}</Row>
        </Section>
      </div>
    </div>
  );
}
