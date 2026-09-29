"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Clock, Calendar, Layers, BarChart3, Settings } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, countKey: null },
  { href: "/admin/practitioners", label: "Practitioners", icon: Users, countKey: "practitioners" },
  { href: "/admin/pending", label: "Pending approval", icon: Clock, countKey: "pending" },
  { href: "/admin/bookings", label: "Appointments", icon: Calendar, countKey: "bookingsToday" },
  { href: "/admin/features", label: "Feature Library", icon: Layers, countKey: null },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, countKey: null },
] as const;

export interface SidebarCounts {
  practitioners: number;
  pending: number;
  bookingsToday: number;
}

export function Sidebar({ counts }: { counts: SidebarCounts }) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 232, flexShrink: 0,
        borderRight: "1px solid var(--zf-border)",
        background: "var(--zf-bg-alt)",
        display: "flex", flexDirection: "column",
        padding: "16px 12px",
        height: "100vh",
        position: "sticky", top: 0,
      }}
    >
      <div style={{ padding: "4px 8px 18px", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: "var(--zf-accent)", color: "#fff",
          display: "grid", placeItems: "center",
          boxShadow: "inset 0 -2px 0 rgba(0,0,0,.12)",
        }}>
          <svg viewBox="0 0 24 24" width={17} height={17} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6h12L6 18h12" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>MentifyLabs</span>
          <span style={{ fontSize: 10, color: "var(--zf-ink-subtle)", marginTop: 3, letterSpacing: "0.04em", textTransform: "uppercase" }}>Super Admin</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {ITEMS.map((item) => {
          const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
          const count = item.countKey ? counts[item.countKey] : undefined;
          return (
            <Link key={item.href} href={item.href} className={"sidebar-link" + (active ? " active" : "")}>
              <item.icon size={17} className="icon" strokeWidth={1.8} />
              <span>{item.label}</span>
              {count !== undefined && <span className="count tnum">{count}</span>}
            </Link>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
        padding: 12, background: "var(--zf-surface)",
        border: "1px solid var(--zf-border)", borderRadius: 10,
        display: "flex", gap: 10, alignItems: "center",
      }}>
        <div className="avatar avatar-sm" style={{ background: "#dad6c8" }}>SA</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.2 }}>Super Admin</div>
          <div style={{ fontSize: 11, color: "var(--zf-ink-subtle)", lineHeight: 1.4 }}>Internal use only</div>
        </div>
        <Settings size={16} style={{ color: "var(--zf-ink-subtle)" }} />
      </div>
    </aside>
  );
}
