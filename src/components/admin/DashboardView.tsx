"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { KPIStrip } from "./ui/Stat";
import { isLive } from "@/lib/practitionerState";

/** How many people the review card lists before pointing to the full queue. */
const QUEUE_PREVIEW = 6;

const APPOINTMENT_ROWS: { status: AppointmentStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "confirmed", label: "Confirmed" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
];

/** One card header: what it is, an optional line of context, and where the full view lives. */
function CardHead({ title, note, href, action }: { title: string; note?: string; href: string; action: string }) {
  return (
    <div className="card-head">
      <div>
        <div className="h2">{title}</div>
        {note && <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginTop: 3 }}>{note}</div>}
      </div>
      <Link href={href} className="btn btn-sm">{action}<ArrowRight size={13} /></Link>
    </div>
  );
}

/** A label with its count, the one row shape used by both summary cards. */
function CountRow({ label, count, muted }: { label: ReactNode; count: number; muted?: boolean }) {
  return (
    <div className="list-row" style={{ padding: "11px 24px" }}>
      <div style={{ flex: 1, fontSize: 14.85, color: muted ? "var(--ml-ink-subtle)" : "var(--ml-ink-2)" }}>{label}</div>
      <div className="tnum" style={{ fontSize: 14.85, fontWeight: 600, color: muted ? "var(--ml-ink-subtle)" : "var(--ml-ink)" }}>{count}</div>
    </div>
  );
}

export function DashboardView({
  practitioners,
  appointments,
  queue,
}: {
  practitioners: Practitioner[];
  appointments: Appointment[];
  /** Practitioners waiting for a decision, longest wait first. */
  queue: Practitioner[];
}) {
  // Everyone is in exactly one of these, so the three add up to the total. "Live" is the same test the public site uses.
  const suspended = practitioners.filter((p) => p.status === "suspended").length;
  const live = practitioners.filter(isLive).length;
  const notLive = practitioners.length - live - suspended;

  const byStatus = new Map<AppointmentStatus, number>();
  for (const a of appointments) byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);

  const shown = queue.slice(0, QUEUE_PREVIEW);

  return (
    <div style={{ padding: "0 var(--ml-gutter) 40px" }}>
      <KPIStrip
        items={[
          { label: "Practitioners", value: practitioners.length },
          { label: "Live profiles", value: live },
          { label: "Awaiting review", value: queue.length },
          { label: "Appointments", value: appointments.length },
        ]}
      />

      <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)", gap: 16, marginTop: 16, alignItems: "start" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <CardHead title="Credential review" href="/admin/pending" action="Open queue" />
          <div style={{ borderTop: "1px solid var(--ml-border-soft)" }}>
            {shown.length === 0 && (
              <div style={{ padding: "28px 24px", fontSize: 13, color: "var(--ml-ink-subtle)" }}>
                All caught up. New submissions appear here as soon as a practitioner sends in their credentials.
              </div>
            )}
            {shown.map((p) => (
              <div key={p.slug} className="list-row">
                <div className="truncate" style={{ minWidth: 0, flex: 1, fontWeight: 500, fontSize: 14.85, color: "var(--ml-ink)" }}>{p.fullName}</div>
                <Link className="btn btn-sm btn-primary" href={`/admin/pending/${p.slug}`}>Review</Link>
              </div>
            ))}
            {queue.length > shown.length && (
              <Link href="/admin/pending" className="list-row" style={{ justifyContent: "space-between", fontSize: 13, color: "var(--ml-accent-2)", fontWeight: 500 }}>
                <span>{queue.length - shown.length} more in the queue</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ overflow: "hidden" }}>
            <CardHead title="Practitioners" href="/admin/practitioners" action="View all" />
            <div style={{ borderTop: "1px solid var(--ml-border-soft)" }}>
              <CountRow label="Live" count={live} />
              <CountRow label="Not live" count={notLive} />
              <CountRow label="Suspended" count={suspended} />
            </div>
          </div>

          <div className="card" style={{ overflow: "hidden" }}>
            <CardHead title="Appointments" note={`${appointments.length} in total`} href="/admin/appointments" action="View all" />
            <div style={{ borderTop: "1px solid var(--ml-border-soft)" }}>
              {APPOINTMENT_ROWS.map(({ status, label }) => (
                <CountRow key={status} label={label} count={byStatus.get(status) ?? 0} muted={!byStatus.get(status)} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
