"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Calendar, MapPin, Video } from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { Practitioner } from "@/types/practitioner";
import { Badge } from "./ui/Badge";
import { FilterSelect } from "./ui/Inputs";
import { EmptyState, Modal } from "./ui/Overlays";
import { Row } from "./ui/Detail";
import { TopBar } from "./TopBar";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-05" -> "5 Oct 2026". Built by hand so the server and the browser always print the same thing. */
const day = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

/** When an appointment was requested. Stored times are UTC. */
const requestedOn = (iso: string) => `${day(iso)}, ${iso.slice(11, 16)}`;

/** The appointments table: who, when, how, what state, and when it was asked for. Nothing else. */
export function AppointmentsView({
  appointments,
  practitioners,
}: {
  appointments: Appointment[];
  practitioners: Practitioner[];
}) {
  const [practitionerSlug, setPractitionerSlug] = useState("");
  const [status, setStatus] = useState<"all" | AppointmentStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const byPractitioner = useMemo(() => new Map(practitioners.map((p) => [p.slug, p])), [practitioners]);

  // The numbers follow the practitioner chosen, so picking one shows just their appointments.
  const forPractitioner = useMemo(
    () => appointments.filter((b) => !practitionerSlug || b.practitionerSlug === practitionerSlug),
    [appointments, practitionerSlug],
  );
  const count = (st: AppointmentStatus) => forPractitioner.filter((b) => b.status === st).length;

  const rows = useMemo(
    () =>
      forPractitioner
        .filter((b) => status === "all" || b.status === status)
        .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)),
    [forPractitioner, status],
  );

  const open = openId ? appointments.find((b) => b.id === openId) ?? null : null;
  const openPractitioner = open ? byPractitioner.get(open.practitionerSlug) : undefined;

  return (
    <div>
      <TopBar icon={Calendar} title="Appointments" subtitle="Every appointment on the platform" />

      <div style={{ padding: "0 var(--ml-gutter) 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* One plain strip: a number and its name, separated by hairlines. No icons, no colour. */}
        <div className="card metric-strip">
          {([
            ["Total", forPractitioner.length],
            ["Pending", count("pending")],
            ["Confirmed", count("confirmed")],
            ["Completed", count("completed")],
            ["Cancelled", count("cancelled")],
          ] as const).map(([label, value]) => (
            <div key={label}>
              <div className="tnum">{value}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--ml-border)", gap: 12, flexWrap: "wrap" }}>
            <div className="h2" style={{ fontSize: 15 }}>All appointments</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <FilterSelect
              value={practitionerSlug}
              onChange={(v) => { setPractitionerSlug(v); }}
              options={[{ value: "", label: "All practitioners" }, ...[...practitioners].sort((a, b) => a.fullName.localeCompare(b.fullName)).map((p) => ({ value: p.slug, label: p.fullName }))]}
              width={240}
            />
            <FilterSelect
              value={status}
              onChange={(v) => { setStatus(v as typeof status); }}
              options={[
                { value: "all", label: "All statuses" },
                { value: "pending", label: "Pending" },
                { value: "confirmed", label: "Confirmed" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
              width={190}
            />
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState icon={<Calendar size={18} />} title="No appointments" body="Nothing matches these filters." />
          ) : (
            <>
              <div className="table-scroll scroll-y tall">
                <table className="table roomy">
                  <thead>
                    <tr>
                      <th>Practitioner</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right", paddingRight: 18 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((b) => (
                      <tr key={b.id} style={{ cursor: "default" }}>
                        <td style={{ fontWeight: 500, color: "var(--ml-ink)" }}>{byPractitioner.get(b.practitionerSlug)?.fullName ?? b.practitionerSlug}</td>
                        <td className="tnum" style={{ whiteSpace: "nowrap" }}>{day(b.date)}</td>
                        <td className="tnum" style={{ whiteSpace: "nowrap" }}>{b.startTime}–{b.endTime}</td>
                        <td><Badge kind={b.status} /></td>
                        <td style={{ textAlign: "right", paddingRight: 18 }}>
                          <button className="btn btn-lg btn-primary" onClick={() => setOpenId(b.id)}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal open={open !== null} onClose={() => setOpenId(null)} title="Appointment" width={520}>
        {open && (
          <div>
            <Row label="Practitioner">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 500 }}>{openPractitioner?.fullName ?? open.practitionerSlug}</span>
                {openPractitioner && (
                  <Link className="btn btn-sm" href={`/admin/practitioners/${openPractitioner.slug}`}>Open profile<ArrowUpRight size={12} /></Link>
                )}
              </span>
            </Row>
            {openPractitioner?.professionalTitle && <Row label="Title">{openPractitioner.professionalTitle}</Row>}
            <Row label="Date"><span className="tnum">{day(open.date)}</span></Row>
            <Row label="Time"><span className="tnum">{open.startTime}–{open.endTime}</span></Row>
            <Row label="Mode">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {open.sessionType === "online" ? <Video size={14} /> : <MapPin size={14} />}
                {open.sessionType === "online" ? "Online (video call)" : "On-Site"}
              </span>
            </Row>
            <Row label="Status"><Badge kind={open.status} /></Row>
            <Row label="Requested on"><span className="tnum">{requestedOn(open.createdAt)} UTC</span></Row>
            <Row label="Appointment ID"><span className="mono" style={{ fontSize: 13 }}>{open.id}</span></Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
