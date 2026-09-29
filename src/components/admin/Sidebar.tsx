"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { initialsOf } from "@/lib/admin";
import { LayoutDashboard, Users, Clock, Calendar, BarChart3, Settings, ShieldCheck, BadgeCheck, LogOut } from "lucide-react";
import { signOutAction } from "@/app/login/actions";

const GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, countKey: null }],
  },
  {
    label: "Manage",
    items: [
      { href: "/admin/practitioners", label: "Practitioners", icon: Users, countKey: "practitioners" },
      { href: "/admin/pending", label: "Pending approval", icon: Clock, countKey: "pending" },
      { href: "/admin/verification", label: "Verification", icon: BadgeCheck, countKey: "verification" },
      { href: "/admin/bookings", label: "Appointments", icon: Calendar, countKey: "bookingsToday" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/reports", label: "Reports", icon: BarChart3, countKey: null },
      { href: "/admin/settings", label: "Settings", icon: Settings, countKey: null },
    ],
  },
] as const;

export interface SidebarCounts {
  practitioners: number;
  pending: number;
  verification: number;
  bookingsToday: number;
}

export function Sidebar({ counts, admin }: { counts: SidebarCounts; admin: { name: string; email: string } }) {
  const pathname = usePathname();

  return (
    <aside className="shell-sidebar">
      <div className="shell-sidebar-inner">
        <div style={{ padding: "2px 8px 8px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "var(--ml-accent)", color: "#fff",
            display: "grid", placeItems: "center",
          }}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6h12L6 18h12" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontSize: 16, fontWeight: 650, letterSpacing: "-0.02em" }}>MentifyLabs</span>
            <span style={{ fontSize: 11.5, color: "var(--ml-ink-subtle)", marginTop: 4 }}>Super Admin</span>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {GROUPS.map((group) => (
            <div key={group.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div className="nav-group">{group.label}</div>
              {group.items.map((item) => {
                const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
                const count = item.countKey ? counts[item.countKey] : undefined;
                return (
                  <Link key={item.href} href={item.href} className={"sidebar-link" + (active ? " active" : "")}>
                    <item.icon size={18} className="icon" strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {count !== undefined && <span className="count tnum">{count}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{
          padding: 12, background: "var(--ml-surface-2)",
          border: "1px solid var(--ml-border-soft)", borderRadius: 12,
          display: "flex", gap: 10, alignItems: "center",
        }}>
          <div className="avatar avatar-md" style={{ background: "var(--ml-accent-soft)", color: "var(--ml-accent-2)", border: "none" }}>{initialsOf(admin.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{admin.name}</div>
            <div className="truncate" style={{ fontSize: 11.5, color: "var(--ml-ink-subtle)", lineHeight: 1.4 }}>{admin.email}</div>
          </div>
          <ShieldCheck size={17} style={{ color: "var(--ml-accent)" }} />
        </div>
        <form action={signOutAction}>
          <button type="submit" className="sidebar-link" style={{ width: "100%", marginTop: 8, border: "none", background: "none", cursor: "pointer" }}>
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
