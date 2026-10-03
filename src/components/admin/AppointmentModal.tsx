"use client";

import Link from "next/link";
import { ExternalLink, MapPin, Video } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Practitioner } from "@/types/practitioner";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Row } from "./ui/Detail";
import { Modal } from "./ui/Overlays";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="h3" style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

/** The details of one booking, in a dialog over the list. Deliberately leaves out the client: who they are and what they wrote stay between them and their practitioner. */
export function AppointmentModal({
  appointment: b,
  practitioner,
  onClose,
}: {
  appointment: Appointment | null;
  practitioner: Practitioner | null;
  onClose: () => void;
}) {
  if (!b) return null;
  const online = b.sessionType === "online";
  const received = b.createdAt.slice(0, 16).replace("T", " ");

  return (
    <Modal open onClose={onClose} title="Appointment" width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div className="kpi-icon" style={{ width: 48, height: 48, borderRadius: 14 }}>
            {online ? <Video size={22} /> : <MapPin size={22} />}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-0.01em" }}>{online ? "Online session" : "On-Site session"}</span>
              <Badge kind={b.status} />
            </div>
            <div className="tnum" style={{ color: "var(--ml-ink-muted)", fontSize: 13.5, marginTop: 3 }}>
              {b.date} · {b.startTime}–{b.endTime}
            </div>
          </div>
        </div>

        <Group title="Practitioner">
          {practitioner ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
              <Avatar name={practitioner.fullName} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }} className="truncate">{practitioner.fullName}</div>
                <div className="truncate" style={{ fontSize: 12.5, color: "var(--ml-ink-muted)", marginTop: 2 }}>{practitioner.professionalTitle}</div>
              </div>
              <Link className="btn btn-sm" href={`/admin/practitioners/${practitioner.slug}`}>
                Open profile<ExternalLink size={12} />
              </Link>
            </div>
          ) : (
            <div className="subtle" style={{ padding: "10px 0", fontSize: 13 }}>This practitioner is no longer on the platform.</div>
          )}
        </Group>

        <Group title="Session">
          <Row label="Status"><Badge kind={b.status} /></Row>
          <Row label="Date"><span className="mono tnum">{b.date}</span></Row>
          <Row label="Time"><span className="mono tnum">{b.startTime}–{b.endTime}</span></Row>
          <Row label="Session mode">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {online ? <Video size={13} /> : <MapPin size={13} />}
              {online ? "Online (video call)" : "On-Site"}
            </span>
          </Row>
        </Group>

        <Group title="Booking">
          <Row label="Booking ID"><span className="mono" style={{ fontSize: 13 }}>{b.id}</span></Row>
          <Row label="Received"><span className="mono tnum">{received}</span></Row>
        </Group>
      </div>
    </Modal>
  );
}
