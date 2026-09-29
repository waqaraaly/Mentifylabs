"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Calendar } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { Avatar } from "./ui/Avatar";
import { BigStat } from "./ui/Stat";
import { DonutChart, GrowthChart } from "./ui/charts";
import { FilterSelect, ClearFiltersButton } from "./ui/Inputs";
import { EmptyState } from "./ui/Overlays";
import { TopBar } from "./TopBar";
import { todayIsoDate } from "@/lib/format";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ReportsView({
  practitioners,
  appointments,
}: {
  practitioners: Practitioner[];
  appointments: Appointment[];
}) {
  const router = useRouter();
  const today = todayIsoDate();
  const currentMonth = today.slice(0, 7);

  const total = practitioners.length;
  const active = practitioners.filter((p) => p.status === "active").length;
  const newThisMonth = practitioners.filter((p) => p.dateJoined.startsWith(currentMonth)).length;

  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const pending = appointments.filter((a) => a.status === "pending").length;

  const incomplete = practitioners.filter((p) => ["incomplete", "draft"].includes(p.profileStatus));
  const noBookings = practitioners.filter((p) => p.status === "active" && !appointments.some((a) => a.practitionerSlug === p.slug));

  // Real monthly growth for the trailing 7 months — no fabricated data.
  const monthly = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    const [y, m] = currentMonth.split("-").map(Number);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTH_LABELS[d.getMonth()] });
    }
    return months.map(({ key, label }) => ({
      m: label,
      new: practitioners.filter((p) => p.dateJoined.startsWith(key)).length,
      active: practitioners.filter((p) => p.dateJoined <= `${key}-31` && p.status !== "rejected").length,
    }));
  }, [practitioners, currentMonth]);

  const [sessionFilter, setSessionFilter] = useState<"all" | "online" | "offline">("all");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");

  const ranking = practitioners
    .map((p) => ({
      p,
      count: appointments.filter((a) =>
        a.practitionerSlug === p.slug
        && (sessionFilter === "all" || a.sessionType === sessionFilter)
        && (statusFilter === "all" || a.status === statusFilter),
      ).length,
    }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  const hasFilters = sessionFilter !== "all" || statusFilter !== "all";

  return (
    <div>
      <TopBar title="Reports &amp; analytics" subtitle="Platform activity, growth, and outliers" />

      <div style={{ padding: "0 32px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <BigStat label="Total practitioners" value={total} delta="all-time" />
          <BigStat label="Active practitioners" value={active} delta={total ? `${Math.round((active / total) * 100)}% of total` : "—"} />
          <BigStat label="New this month" value={newThisMonth} delta={new Date().toLocaleString("en-US", { month: "long", year: "numeric" })} accent="var(--zf-info)" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <div className="h2">Practitioner growth</div>
                <div style={{ fontSize: 12.5, color: "var(--zf-ink-subtle)", marginTop: 2 }}>New sign-ups vs. cumulative active, last 7 months</div>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 11.5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--zf-ink-muted)" }}>
                  <span style={{ width: 8, height: 8, background: "var(--zf-accent)", borderRadius: 50 }} />New
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--zf-ink-muted)" }}>
                  <span style={{ width: 14, height: 0, borderTop: "1.5px dashed var(--zf-ink-faint)" }} />Active total
                </span>
              </div>
            </div>
            <div style={{ marginTop: 18 }}>
              <GrowthChart data={monthly} />
            </div>
          </div>

          <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column" }}>
            <div className="h2">Appointment outcomes</div>
            <div style={{ fontSize: 12.5, color: "var(--zf-ink-subtle)", marginTop: 2 }}>Across all {appointments.length} bookings</div>
            <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 18 }}>
              <DonutChart data={[
                { value: completed, color: "var(--zf-info)" },
                { value: confirmed, color: "var(--zf-ok)" },
                { value: cancelled, color: "var(--zf-danger)" },
                { value: pending, color: "var(--zf-warn)" },
              ]} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <Outcome label="Completed" value={completed} color="var(--zf-info)" total={appointments.length} />
                <Outcome label="Confirmed" value={confirmed} color="var(--zf-ok)" total={appointments.length} />
                <Outcome label="Cancelled" value={cancelled} color="var(--zf-danger)" total={appointments.length} />
                <Outcome label="Pending" value={pending} color="var(--zf-warn)" total={appointments.length} />
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--zf-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="h2">Booking requests per practitioner</div>
              <div style={{ fontSize: 12.5, color: "var(--zf-ink-subtle)", marginTop: 2 }}>Sorted by total volume</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <FilterSelect value={sessionFilter} onChange={(v) => setSessionFilter(v as typeof sessionFilter)} width={140} options={[
                { value: "all", label: "All sessions" },
                { value: "online", label: "Online" },
                { value: "offline", label: "Onsite" },
              ]} />
              <FilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v as typeof statusFilter)} width={150} options={[
                { value: "all", label: "All statuses" },
                { value: "confirmed", label: "Confirmed" },
                { value: "pending", label: "Pending" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]} />
              {hasFilters && <ClearFiltersButton onClick={() => { setSessionFilter("all"); setStatusFilter("all"); }} />}
            </div>
          </div>
          {ranking.length === 0 ? (
            <EmptyState title="No bookings match" body="No practitioners have bookings for these filters." />
          ) : ranking.map((x, i, arr) => {
            const max = arr[0].count;
            const pct = (x.count / max) * 100;
            return (
              <div
                key={x.p.slug}
                onClick={() => router.push("/admin/practitioners")}
                style={{
                  padding: "12px 18px", borderBottom: i === arr.length - 1 ? "none" : "1px solid var(--zf-border-soft)",
                  display: "grid", gridTemplateColumns: "1.5fr 1fr 70px", gap: 16, alignItems: "center", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="mono tnum" style={{ color: "var(--zf-ink-subtle)", fontSize: 11, width: 18 }}>{String(i + 1).padStart(2, "0")}</span>
                  <Avatar name={x.p.fullName} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }} className="truncate">{x.p.fullName}</div>
                    <div className="truncate" style={{ fontSize: 11.5, color: "var(--zf-ink-subtle)" }}>{x.p.professionalTitle}</div>
                  </div>
                </div>
                <div style={{ height: 6, background: "var(--zf-surface-3)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: pct + "%", height: "100%", background: "var(--zf-accent)", borderRadius: 999 }} />
                </div>
                <div className="tnum" style={{ fontSize: 13, fontWeight: 500, textAlign: "right" }}>{x.count}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <ListCard
            title="Signed up but profile incomplete"
            icon={<AlertTriangle size={14} />}
            accent="var(--zf-warn)"
            items={incomplete}
            emptyTitle="No incomplete profiles"
            right={(p) => <span className="mono" style={{ fontSize: 10.5, color: "var(--zf-ink-subtle)" }}>Joined {p.dateJoined}</span>}
            onClick={() => router.push("/admin/practitioners")}
          />
          <ListCard
            title="Active practitioners with no bookings"
            subtitle="Approved accounts that haven't received a booking yet"
            icon={<Calendar size={14} />}
            accent="var(--zf-neutral)"
            items={noBookings}
            emptyTitle="Everyone's getting bookings"
            right={(p) => <span className="mono" style={{ fontSize: 11, color: "var(--zf-ink-subtle)" }}>0 bookings · approved {p.approvedOn ?? "—"}</span>}
            onClick={() => router.push("/admin/practitioners")}
          />
        </div>
      </div>
    </div>
  );
}

function Outcome({ label, value, color, total }: { label: string; value: number; color: string; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
      <span style={{ width: 8, height: 8, background: color, borderRadius: 2 }} />
      <span style={{ flex: 1, color: "var(--zf-ink-2)" }}>{label}</span>
      <span className="tnum" style={{ color: "var(--zf-ink-subtle)" }}>{pct}%</span>
      <span className="tnum" style={{ fontWeight: 500, width: 28, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function ListCard({
  title, subtitle, icon, accent, items, emptyTitle, right, onClick,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
  items: Practitioner[];
  emptyTitle: string;
  right: (p: Practitioner) => React.ReactNode;
  onClick: (p: Practitioner) => void;
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--zf-border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--zf-surface-3)", display: "grid", placeItems: "center", color: accent }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div className="h2" style={{ fontSize: 14.5 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "var(--zf-ink-subtle)", marginTop: 1 }}>{subtitle}</div>}
        </div>
        <span className="tnum" style={{ fontSize: 13, color: "var(--zf-ink-muted)" }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <EmptyState title={emptyTitle} />
      ) : (
        <div>
          {items.map((p, i) => (
            <div key={p.slug} onClick={() => onClick(p)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 18px",
              borderBottom: i === items.length - 1 ? "none" : "1px solid var(--zf-border-soft)", cursor: "pointer",
            }}>
              <Avatar name={p.fullName} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="truncate" style={{ fontSize: 13.5, fontWeight: 500 }}>{p.fullName}</div>
                <div className="truncate" style={{ fontSize: 11.5, color: "var(--zf-ink-subtle)" }}>{p.professionalTitle}</div>
              </div>
              {right(p)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
