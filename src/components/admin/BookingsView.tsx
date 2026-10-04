"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Calendar, CalendarCheck, CalendarClock, ChevronRight, Download, Hourglass, MapPin, Video, XCircle } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import type { Practitioner } from "@/types/practitioner";
import { addDays, mondayOf } from "@/lib/format";
import { Badge } from "./ui/Badge";
import { SearchInput, FilterSelect, ClearFiltersButton } from "./ui/Inputs";
import { EmptyState } from "./ui/Overlays";
import { BookingDrawer } from "./BookingDrawer";
import { TopBar } from "./TopBar";

type TabId = "all" | "today" | "upcoming" | "pending" | "completed" | "cancelled";
type SortKey = "date" | "received";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

/** Upcoming and today read best soonest-first; history reads best newest-first. */
const defaultDir = (tab: TabId): SortDir => (tab === "today" || tab === "upcoming" ? "asc" : "desc");

const inTab = (b: Appointment, tab: TabId, today: string): boolean => {
  switch (tab) {
    case "today": return b.date === today && b.status !== "cancelled";
    case "upcoming": return b.date >= today && (b.status === "pending" || b.status === "confirmed");
    case "pending": return b.status === "pending";
    case "completed": return b.status === "completed";
    case "cancelled": return b.status === "cancelled";
    default: return true;
  }
};

const isOverdue = (b: Appointment, today: string) => b.status === "pending" && b.date < today;

function dayLabel(date: string, today: string): string {
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  if (date === addDays(today, -1)) return "Yesterday";
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}

function monthRange(today: string): [string, string] {
  const [y, m] = today.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return [`${today.slice(0, 7)}-01`, `${today.slice(0, 7)}-${String(last).padStart(2, "0")}`];
}

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function BookingsView({
  appointments,
  practitioners,
  today,
}: {
  appointments: Appointment[];
  practitioners: Practitioner[];
  today: string;
}) {
  const [tab, setTab] = useState<TabId>("all");
  const [q, setQ] = useState("");
  const [practitionerSlug, setPractitionerSlug] = useState("");
  const [mode, setMode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);

  const byPractitioner = useMemo(() => new Map(practitioners.map((p) => [p.slug, p])), [practitioners]);

  const counts = useMemo(() => ({
    today: appointments.filter((b) => inTab(b, "today", today)).length,
    upcoming: appointments.filter((b) => inTab(b, "upcoming", today)).length,
    pending: appointments.filter((b) => b.status === "pending").length,
    overdue: appointments.filter((b) => isOverdue(b, today)).length,
    cancelled: appointments.filter((b) => b.status === "cancelled").length,
  }), [appointments, today]);

  const filtersActive = !!(q || practitionerSlug || mode || from || to);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = appointments.filter((b) => {
      if (!inTab(b, tab, today)) return false;
      if (practitionerSlug && b.practitionerSlug !== practitionerSlug) return false;
      if (mode && b.sessionType !== mode) return false;
      if (from && b.date < from) return false;
      if (to && b.date > to) return false;
      if (s) {
        const p = byPractitioner.get(b.practitionerSlug);
        const hay = `${p?.fullName ?? ""} ${p?.professionalTitle ?? ""} ${b.id}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
    const sign = sortDir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      const ka = sortKey === "date" ? `${a.date} ${a.startTime}` : a.createdAt;
      const kb = sortKey === "date" ? `${b.date} ${b.startTime}` : b.createdAt;
      return ka < kb ? -sign : ka > kb ? sign : 0;
    });
  }, [appointments, tab, today, practitionerSlug, mode, from, to, q, byPractitioner, sortKey, sortDir]);

  const visible = rows.slice(0, shown);
  const grouped = sortKey === "date";

  const changeTab = (t: TabId) => {
    setTab(t);
    setSortKey("date");
    setSortDir(defaultDir(t));
    setShown(PAGE_SIZE);
  };

  const clearFilters = () => {
    setQ(""); setPractitionerSlug(""); setMode(""); setFrom(""); setTo(""); setShown(PAGE_SIZE);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const preset = (a: string, b: string) => { setFrom(a); setTo(b); setShown(PAGE_SIZE); };

  const exportCsv = () => {
    const head = ["Booking ID", "Practitioner", "Date", "Start", "End", "Mode", "Status", "Received"];
    const lines = rows.map((b) => [
      b.id,
      byPractitioner.get(b.practitionerSlug)?.fullName ?? b.practitionerSlug,
      b.date, b.startTime, b.endTime,
      b.sessionType === "online" ? "Online" : "On-Site",
      b.status,
      b.createdAt.slice(0, 16).replace("T", " "),
    ].map(csvCell).join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openIdx = openId ? rows.findIndex((b) => b.id === openId) : -1;
  const open = openIdx >= 0 ? rows[openIdx] : null;

  const sortHead = (k: SortKey, children: React.ReactNode, width?: number) => (
    <th key={k} style={{ width }} aria-sort={sortKey === k ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className="th-sort" onClick={() => toggleSort(k)}>
        {children}
        {sortKey === k && (sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  );

  const [monthFrom, monthTo] = monthRange(today);
  const weekFrom = mondayOf(today);

  const tiles: { id: TabId; label: string; value: number; hint?: string; icon: React.ReactNode }[] = [
    { id: "today", label: "Today", value: counts.today, icon: <CalendarCheck size={16} /> },
    { id: "upcoming", label: "Upcoming", value: counts.upcoming, icon: <CalendarClock size={16} /> },
    { id: "pending", label: "Pending", value: counts.pending, hint: counts.overdue ? `${counts.overdue} overdue` : undefined, icon: <Hourglass size={16} /> },
    { id: "cancelled", label: "Cancelled", value: counts.cancelled, icon: <XCircle size={16} /> },
  ];

  return (
    <div>
      <TopBar
        icon={Calendar}
        title="Appointments"
        subtitle="Every booking on the platform, by day, status and practitioner"
        actions={
          <button className="btn btn-sm" onClick={exportCsv} disabled={rows.length === 0}>
            <Download size={13} />Export CSV
          </button>
        }
      />

      <div style={{ padding: "0 var(--ml-gutter) 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* At a glance — each tile jumps to its list */}
        <div className="stat-tiles">
          {tiles.map((t) => (
            <button key={t.id} type="button" className={"stat-tile" + (tab === t.id ? " active" : "")} onClick={() => changeTab(tab === t.id ? "all" : t.id)}>
              <span className="kpi-icon" style={{ width: 34, height: 34, borderRadius: 10 }}>{t.icon}</span>
              <span style={{ minWidth: 0 }}>
                <span className="tnum" style={{ display: "block", fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>{t.value}</span>
                <span style={{ display: "block", fontSize: 12.5, color: "var(--ml-ink-muted)", marginTop: 2 }}>
                  {t.label}{t.hint && <span style={{ color: "var(--ml-danger)", fontWeight: 500 }}> · {t.hint}</span>}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="tabs-line" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={"tab-line" + (tab === t.id ? " active" : "")} onClick={() => changeTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--ml-border)", display: "flex", gap: 8, alignItems: "center", background: "var(--ml-surface-2)", flexWrap: "wrap" }}>
            <SearchInput value={q} onChange={(v) => { setQ(v); setShown(PAGE_SIZE); }} placeholder="Search practitioner or booking ID…" width={260} />
            <FilterSelect
              value={practitionerSlug}
              onChange={(v) => { setPractitionerSlug(v); setShown(PAGE_SIZE); }}
              options={[{ value: "", label: "All practitioners" }, ...practitioners.map((p) => ({ value: p.slug, label: p.fullName }))]}
              width={200}
            />
            <FilterSelect
              value={mode}
              onChange={(v) => { setMode(v); setShown(PAGE_SIZE); }}
              options={[{ value: "", label: "Any session type" }, { value: "online", label: "Online" }, { value: "offline", label: "On-Site" }]}
              width={170}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input className="input input-plain" type="date" aria-label="From date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setShown(PAGE_SIZE); }} style={{ width: 142 }} />
              <span style={{ color: "var(--ml-ink-subtle)", fontSize: 12.5 }}>to</span>
              <input className="input input-plain" type="date" aria-label="To date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setShown(PAGE_SIZE); }} style={{ width: 142 }} />
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button type="button" className="chip" onClick={() => preset(today, today)}>Today</button>
              <button type="button" className="chip" onClick={() => preset(weekFrom, addDays(weekFrom, 6))}>This week</button>
              <button type="button" className="chip" onClick={() => preset(monthFrom, monthTo)}>This month</button>
            </div>
            <div style={{ flex: 1 }} />
            {filtersActive && <ClearFiltersButton onClick={clearFilters} />}
            <span className="tnum" style={{ fontSize: 12.5, color: "var(--ml-ink-muted)" }}>
              {rows.length} {rows.length === 1 ? "booking" : "bookings"}
            </span>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={<Calendar size={18} />}
              title="No appointments match"
              body={filtersActive ? "Nothing fits these filters. Clear them to see everything in this view." : "Nothing in this view yet."}
            />
          ) : (
            <>
              <div className="table-scroll scroll-y tall">
                <table className="table" style={{ border: "none" }}>
                  <thead>
                    <tr>
                      {sortHead("date", grouped ? "Time" : "Date & time", grouped ? 130 : 190)}
                      <th>Practitioner</th>
                      <th style={{ width: 110 }}>Session</th>
                      <th style={{ width: 130 }}>Status</th>
                      {sortHead("received", "Received", 150)}
                      <th style={{ width: 36 }} aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((b, i) => {
                      const p = byPractitioner.get(b.practitionerSlug);
                      const heading = grouped && b.date !== visible[i - 1]?.date;
                      return [
                        heading && (
                          <tr key={`h-${b.date}`} className="day-row">
                            <td colSpan={6}>
                              <span style={{ fontWeight: 600, color: "var(--ml-ink)" }}>{dayLabel(b.date, today)}</span>
                              <span className="tnum" style={{ marginLeft: 8, color: "var(--ml-ink-subtle)" }}>{b.date}</span>
                            </td>
                          </tr>
                        ),
                        <tr key={b.id} className={openId === b.id ? "selected" : undefined} onClick={() => setOpenId(b.id)}>
                          <td>
                            {!grouped && <div className="tnum" style={{ fontSize: 12, color: "var(--ml-ink-muted)" }}>{b.date}</div>}
                            <div className="tnum" style={{ fontSize: 13 }}>{b.startTime}–{b.endTime}</div>
                          </td>
                          <td>
                            <div className="truncate" style={{ fontWeight: 500, fontSize: 13.5 }}>{p?.fullName ?? b.practitionerSlug}</div>
                            <div className="truncate" style={{ fontSize: 11.5, color: "var(--ml-ink-subtle)" }}>{p?.professionalTitle}</div>
                          </td>
                          <td>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--ml-ink-muted)" }}>
                              {b.sessionType === "online" ? <Video size={13} /> : <MapPin size={13} />}
                              {b.sessionType === "online" ? "Online" : "On-Site"}
                            </span>
                          </td>
                          <td>
                            <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                              <Badge kind={b.status} />
                              {isOverdue(b, today) && <Badge kind="cancelled" dot={false}>Overdue</Badge>}
                            </span>
                          </td>
                          <td className="tnum" style={{ fontSize: 12.5, color: "var(--ml-ink-muted)" }}>{b.createdAt.slice(0, 16).replace("T", " ")}</td>
                          <td style={{ color: "var(--ml-ink-faint)", paddingLeft: 0 }}><ChevronRight size={15} /></td>
                        </tr>,
                      ];
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length > visible.length && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, padding: 12, borderTop: "1px solid var(--ml-border-soft)" }}>
                  <span className="tnum" style={{ fontSize: 12.5, color: "var(--ml-ink-muted)" }}>Showing {visible.length} of {rows.length}</span>
                  <button className="btn btn-sm" onClick={() => setShown((n) => n + PAGE_SIZE)}>Show more</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BookingDrawer
        appointment={open}
        practitioner={open ? byPractitioner.get(open.practitionerSlug) ?? null : null}
        position={openIdx + 1}
        total={rows.length}
        onPrev={openIdx > 0 ? () => setOpenId(rows[openIdx - 1].id) : null}
        onNext={openIdx >= 0 && openIdx < rows.length - 1 ? () => setOpenId(rows[openIdx + 1].id) : null}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
