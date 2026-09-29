"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Eye, MapPin, Video, X, ExternalLink } from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { Practitioner } from "@/types/practitioner";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { SearchInput, FilterSelect, ClearFiltersButton } from "./ui/Inputs";
import { Drawer, EmptyState, Field } from "./ui/Overlays";
import { TopBar } from "./TopBar";

export function BookingsView({
  appointments,
  practitioners,
}: {
  appointments: Appointment[];
  practitioners: Practitioner[];
}) {
  const [status, setStatus] = useState<AppointmentStatus | "all">("all");
  const [practitionerSlug, setPractitionerSlug] = useState("");
  const [date, setDate] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const byPractitioner = useMemo(() => new Map(practitioners.map((p) => [p.slug, p])), [practitioners]);

  const filtered = appointments.filter((b) => {
    if (status !== "all" && b.status !== status) return false;
    if (practitionerSlug && b.practitionerSlug !== practitionerSlug) return false;
    if (date && b.date !== date) return false;
    if (q) {
      const p = byPractitioner.get(b.practitionerSlug);
      const s = q.toLowerCase();
      if (!p?.fullName.toLowerCase().includes(s) && !b.clientId.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const counts = {
    all: appointments.length,
    pending: appointments.filter((b) => b.status === "pending").length,
    confirmed: appointments.filter((b) => b.status === "confirmed").length,
    completed: appointments.filter((b) => b.status === "completed").length,
    cancelled: appointments.filter((b) => b.status === "cancelled").length,
  };

  const openB = appointments.find((b) => b.id === openId) ?? null;
  const hasFilters = status !== "all" || practitionerSlug || date || q;

  return (
    <div>
      <TopBar title="Appointments" subtitle="All bookings — pending, confirmed, completed, cancelled" />

      <div style={{ padding: "0 32px 32px" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 0", borderBottom: "1px solid var(--zf-border)" }}>
            <div className="tabs" style={{ border: "none" }}>
              {([
                { id: "all", label: "All", c: counts.all },
                { id: "pending", label: "Pending", c: counts.pending },
                { id: "confirmed", label: "Confirmed", c: counts.confirmed },
                { id: "completed", label: "Completed", c: counts.completed },
                { id: "cancelled", label: "Cancelled", c: counts.cancelled },
              ] as const).map((t) => (
                <button key={t.id} className={"tab" + (status === t.id ? " active" : "")} onClick={() => setStatus(t.id)}>
                  {t.label}<span className="pill tnum">{t.c}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--zf-border)", display: "flex", gap: 8, alignItems: "center", background: "var(--zf-surface-2)", flexWrap: "wrap" }}>
            <SearchInput value={q} onChange={setQ} placeholder="Search by client or practitioner…" width={280} />
            <FilterSelect
              value={practitionerSlug}
              onChange={setPractitionerSlug}
              options={[{ value: "", label: "All practitioners" }, ...practitioners.map((p) => ({ value: p.slug, label: p.fullName }))]}
              width={200}
            />
            <div style={{ position: "relative" }}>
              <Calendar size={14} style={{ position: "absolute", left: 10, top: 9, color: "var(--zf-ink-subtle)" }} />
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ paddingLeft: 30, width: 160 }} />
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 12.5, color: "var(--zf-ink-muted)" }}>
              <span className="tnum">{filtered.length}</span> of <span className="tnum">{appointments.length}</span>
            </div>
            {hasFilters && <ClearFiltersButton onClick={() => { setStatus("all"); setPractitionerSlug(""); setDate(""); setQ(""); }} />}
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={<Calendar size={18} />} title="No appointments match" body="Adjust filters above or clear them to see all bookings." />
          ) : (
            <table className="table" style={{ border: "none" }}>
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Client</th>
                  <th>Practitioner</th>
                  <th style={{ width: 150 }}>Date &amp; time</th>
                  <th style={{ width: 110 }}>Session</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 80, textAlign: "right", paddingRight: 18 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const p = byPractitioner.get(b.practitionerSlug);
                  return (
                    <tr key={b.id} className={openId === b.id ? "selected" : ""} onClick={() => setOpenId(b.id)}>
                      <td><span className="mono" style={{ fontSize: 12.5 }}>{b.clientId}</span></td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <Avatar name={p?.fullName ?? b.practitionerSlug} size="sm" />
                          <div style={{ minWidth: 0 }}>
                            <div className="truncate" style={{ fontWeight: 500, fontSize: 13.5 }}>{p?.fullName ?? b.practitionerSlug}</div>
                            <div className="truncate" style={{ fontSize: 11.5, color: "var(--zf-ink-subtle)" }}>{p?.professionalTitle}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="mono tnum" style={{ fontSize: 12.5 }}>{b.date}</div>
                        <div className="mono tnum" style={{ fontSize: 12, color: "var(--zf-ink-subtle)" }}>{b.startTime}–{b.endTime}</div>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--zf-ink-muted)" }}>
                          {b.sessionType === "online" ? <Video size={13} /> : <MapPin size={13} />}
                          {b.sessionType === "online" ? "Online" : "Onsite"}
                        </span>
                      </td>
                      <td><Badge kind={b.status} /></td>
                      <td style={{ textAlign: "right", paddingRight: 18 }} onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-sm" onClick={() => setOpenId(b.id)}><Eye size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Drawer open={!!openB} onClose={() => setOpenId(null)} width={560}>
        {openB && <BookingDetail b={openB} practitioner={byPractitioner.get(openB.practitionerSlug) ?? null} onClose={() => setOpenId(null)} />}
      </Drawer>
    </div>
  );
}

function BookingDetail({
  b,
  practitioner,
  onClose,
}: {
  b: Appointment;
  practitioner: Practitioner | null;
  onClose: () => void;
}) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--zf-border)" }}>
        <div>
          <div className="h2">Appointment</div>
          <div className="mono" style={{ fontSize: 12, color: "var(--zf-ink-subtle)", marginTop: 2 }}>{b.id}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
      </div>

      <div style={{ padding: "20px 24px", overflow: "auto", flex: 1 }}>
        {practitioner && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: "1px solid var(--zf-border)", borderRadius: 10, background: "var(--zf-surface)" }}>
            <Avatar name={practitioner.fullName} size="md" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500 }}>{practitioner.fullName}</div>
              <div style={{ fontSize: 12.5, color: "var(--zf-ink-muted)" }}>{practitioner.professionalTitle}</div>
            </div>
            <button className="btn btn-sm" onClick={() => { router.push("/admin/practitioners"); onClose(); }}>
              Open profile<ExternalLink size={12} />
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, columnGap: 24, marginTop: 14 }}>
          <Field label="Client ID"><span className="mono">{b.clientId}</span></Field>
          <Field label="Status"><Badge kind={b.status} /></Field>
          <Field label="Client name" value={b.clientName} />
          <Field label="Contact" value={b.clientContact} mono />
          <Field label="Date" mono value={b.date} />
          <Field label="Time" mono value={`${b.startTime}–${b.endTime}`} />
          <Field label="Session type">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {b.sessionType === "online" ? <Video size={13} /> : <MapPin size={13} />}
              {b.sessionType === "online" ? "Online (video call)" : "Onsite"}
            </span>
          </Field>
          {b.concern && <Field label="Concern" value={b.concern} />}
          <Field label="Booked on" mono value={b.createdAt.slice(0, 16).replace("T", " ")} />
        </div>
      </div>
    </div>
  );
}
