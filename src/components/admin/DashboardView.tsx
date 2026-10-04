"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, MapPin, ArrowRight, Check, Eye, Users, UserCheck, UserX, Clock, CalendarDays } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Appointment } from "@/types/appointment";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { KPI } from "./ui/Stat";
import { useToast } from "./ui/ToastProvider";
import { approveSubmissionAction } from "@/app/admin/actions";
import { isAwaitingApproval } from "@/lib/verification";

export function DashboardView({
  practitioners,
  appointments,
  today,
}: {
  practitioners: Practitioner[];
  appointments: Appointment[];
  today: string;
}) {
  const [, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const totalP = practitioners.length;
  const activeP = practitioners.filter((p) => p.status === "active").length;
  const pendingP = practitioners.filter(isAwaitingApproval);
  const suspendedP = practitioners.filter((p) => p.status === "suspended").length;

  const todayB = appointments.filter((a) => a.date === today);
  const pendingReq = appointments.filter((a) => a.status === "pending").length;
  const byPractitioner = new Map(practitioners.map((p) => [p.slug, p]));

  const approve = (slug: string, name: string) => startTransition(async () => {
    await approveSubmissionAction(slug);
    addToast(`${name} approved`, "ok");
    router.refresh();
  });

  return (
    <div style={{ padding: "0 var(--ml-gutter) 40px" }}>
      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
        <KPI label="Total registered" value={totalP} icon={<Users size={17} />} />
        <KPI label="Active" value={activeP} icon={<UserCheck size={17} />} />
        <KPI label="Pending approval" value={pendingP.length} icon={<Clock size={17} />} />
        <KPI label="Suspended" value={suspendedP} icon={<UserX size={17} />} />
        <KPI label="Total bookings" value={appointments.length} icon={<CalendarDays size={17} />} />
      </div>

      <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1fr)", gap: 16, marginTop: 16, alignItems: "start" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-head">
            <div>
              <div className="h2">Today&apos;s schedule</div>
              <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginTop: 3 }}>{todayB.length} {todayB.length === 1 ? "appointment" : "appointments"} · {pendingReq} need attention</div>
            </div>
            <Link href="/admin/bookings" className="btn btn-sm">View all<ArrowRight size={13} /></Link>
          </div>
          <div style={{ borderTop: "1px solid var(--ml-border-soft)" }}>
            {todayB.length === 0 && (
              <div style={{ padding: "28px 20px", fontSize: 13, color: "var(--ml-ink-subtle)" }}>No appointments today.</div>
            )}
            {todayB.slice(0, 8).map((b) => {
              const p = byPractitioner.get(b.practitionerSlug);
              if (!p) return null;
              return (
                <div key={b.id} className="list-row">
                  <div className="tnum" style={{ width: 48, fontSize: 13, fontWeight: 600, color: "var(--ml-ink-2)" }}>{b.startTime}</div>
                  <Avatar name={p.fullName} size="md" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="truncate" style={{ fontWeight: 600, fontSize: 13.5 }}>{p.fullName}</div>
                    <div className="truncate" style={{ fontSize: 12, color: "var(--ml-ink-subtle)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                      {b.sessionType === "online" ? <Video size={12} /> : <MapPin size={12} />}
                      {b.sessionType === "online" ? "Online" : "On-Site"} · <span className="mono">{b.clientId}</span>
                    </div>
                  </div>
                  <Badge kind={b.status} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-head">
            <div>
              <div className="h2">Needs attention</div>
              <div style={{ fontSize: 13, color: "var(--ml-ink-muted)", marginTop: 3 }}>Waiting on your review</div>
            </div>
            <Link href="/admin/pending" className="btn btn-sm">Open queue<ArrowRight size={13} /></Link>
          </div>
          <div style={{ borderTop: "1px solid var(--ml-border-soft)" }}>
            {pendingP.length === 0 ? (
              <div style={{ padding: "28px 20px", fontSize: 13, color: "var(--ml-ink-subtle)" }}>Nothing pending right now.</div>
            ) : (
              pendingP.map((p) => (
                <div key={p.slug} className="list-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 12, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={p.fullName} size="md" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="truncate" style={{ fontWeight: 600, fontSize: 13.5 }}>{p.fullName}</div>
                      <div className="truncate" style={{ fontSize: 12, color: "var(--ml-ink-muted)", marginTop: 2 }}>
                        {p.professionalTitle} · {p.creationMethod === "self" ? "Self sign-up" : "Created by admin"} · {p.dateJoined}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-sm btn-primary" onClick={() => approve(p.slug, p.fullName)}>
                      <Check size={13} />Approve
                    </button>
                    <Link className="btn btn-sm" href={`/admin/pending/${p.slug}`}><Eye size={13} />Review</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
