"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, MapPin, ExternalLink, Check, Eye } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Appointment } from "@/types/appointment";
import type { PractitionerDocument } from "@/types/document";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { KPI } from "./ui/Stat";
import { ProfileReviewDrawer } from "./ProfileReviewDrawer";
import { useToast } from "./ui/ToastProvider";
import { approveAccount } from "@/app/admin/actions";

export function DashboardView({
  practitioners,
  appointments,
  today,
  documentsByPending,
  siteUrl,
}: {
  practitioners: Practitioner[];
  appointments: Appointment[];
  today: string;
  documentsByPending: Record<string, PractitionerDocument[]>;
  siteUrl: string;
}) {
  const [reviewSlug, setReviewSlug] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const addToast = useToast();
  const router = useRouter();

  const totalP = practitioners.length;
  const activeP = practitioners.filter((p) => p.status === "active").length;
  const pendingP = practitioners.filter((p) => p.status === "pending");
  const suspendedP = practitioners.filter((p) => p.status === "suspended").length;

  const todayB = appointments.filter((a) => a.date === today);
  const pendingReq = appointments.filter((a) => a.status === "pending").length;
  const byPractitioner = new Map(practitioners.map((p) => [p.slug, p]));

  const reviewPractitioner = practitioners.find((p) => p.slug === reviewSlug) ?? null;

  const approve = (slug: string, name: string) => startTransition(async () => {
    await approveAccount(slug);
    addToast(`${name} approved`, "ok");
    router.refresh();
  });

  return (
    <div style={{ padding: "0 32px 32px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div className="label">Practitioners</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          <KPI label="Total registered" value={totalP} />
          <KPI label="Active" value={activeP} />
          <KPI label="Pending approval" value={pendingP.length} />
          <KPI label="Suspended" value={suspendedP} />
          <KPI label="Total bookings" value={appointments.length} />
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--zf-border)" }}>
            <div>
              <div className="h2">Today&apos;s schedule</div>
              <div style={{ fontSize: 12.5, color: "var(--zf-ink-subtle)", marginTop: 2 }}>{todayB.length} appointments · {pendingReq} need attention</div>
            </div>
            <Link href="/admin/bookings" className="btn btn-ghost btn-sm">View all<ExternalLink size={13} /></Link>
          </div>
          <div>
            {todayB.length === 0 && (
              <div style={{ padding: "24px 18px", fontSize: 13, color: "var(--zf-ink-subtle)" }}>No appointments today.</div>
            )}
            {todayB.slice(0, 8).map((b, i, arr) => {
              const p = byPractitioner.get(b.practitionerSlug);
              if (!p) return null;
              return (
                <div key={b.id} style={{
                  display: "grid", gridTemplateColumns: "60px 28px 1fr 90px 120px",
                  alignItems: "center", gap: 12, padding: "10px 18px",
                  borderBottom: i === arr.length - 1 ? "none" : "1px solid var(--zf-border-soft)",
                }}>
                  <div className="mono tnum" style={{ fontSize: 12.5, color: "var(--zf-ink-muted)" }}>{b.startTime}</div>
                  <Avatar name={p.fullName} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <div className="truncate" style={{ fontWeight: 500, fontSize: 13.5 }}>{p.fullName}</div>
                    <div className="truncate mono" style={{ fontSize: 11.5, color: "var(--zf-ink-subtle)" }}>{b.clientId}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--zf-ink-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                    {b.sessionType === "online" ? <Video size={13} /> : <MapPin size={13} />}
                    <span>{b.sessionType === "online" ? "Online" : "Onsite"}</span>
                  </div>
                  <Badge kind={b.status} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--zf-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="h2">Needs attention</div>
            <div style={{ fontSize: 12.5, color: "var(--zf-ink-subtle)", marginTop: 2 }}>Practitioners waiting on your review</div>
          </div>
          <Link href="/admin/pending" className="btn btn-sm">Open queue<ExternalLink size={13} /></Link>
        </div>
        {pendingP.length === 0 ? (
          <div style={{ padding: "24px 18px", fontSize: 13, color: "var(--zf-ink-subtle)" }}>Nothing pending right now.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
            {pendingP.map((p, i, arr) => (
              <div key={p.slug} style={{
                padding: 18, borderRight: i < arr.length - 1 ? "1px solid var(--zf-border-soft)" : "none",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={p.fullName} size="md" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{p.fullName}</div>
                    <div className="truncate" style={{ fontSize: 12, color: "var(--zf-ink-muted)" }}>{p.professionalTitle}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--zf-ink-muted)", lineHeight: 1.5 }}>
                  Submitted {p.dateJoined} · {p.creationMethod === "self" ? "Self sign-up" : "Created by admin"}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                  <button className="btn btn-sm btn-primary" onClick={() => approve(p.slug, p.fullName)}>
                    <Check size={13} />Approve
                  </button>
                  <button className="btn btn-sm" onClick={() => setReviewSlug(p.slug)}><Eye size={13} />Review</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProfileReviewDrawer
        practitioner={reviewPractitioner}
        documents={reviewPractitioner ? documentsByPending[reviewPractitioner.slug] ?? [] : []}
        siteUrl={siteUrl}
        onClose={() => setReviewSlug(null)}
      />
    </div>
  );
}
