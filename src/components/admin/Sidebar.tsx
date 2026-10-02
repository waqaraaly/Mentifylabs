"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { initialsOf } from "@/lib/admin";
import { LayoutDashboard, Users, UserCog, Clock, Calendar, BarChart3, Settings, ShieldCheck, BadgeCheck, LogOut } from "lucide-react";
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
      { href: "/admin/users", label: "Manage Users", icon: UserCog, countKey: null },
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
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6h12L6 18h12" />
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">MentifyLabs</span>
            <span className="sidebar-brand-sub">Super Admin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {GROUPS.map((group) => (
            <div key={group.label} className="nav-group-block">
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

        <div className="sidebar-footer">
          <div className="sidebar-profile">
            <div className="avatar avatar-md" style={{ background: "var(--ml-accent-soft)", color: "var(--ml-accent-2)", border: "none" }}>
              {initialsOf(admin.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-profile-name truncate">{admin.name}</div>
              <div className="sidebar-profile-email truncate">{admin.email}</div>
            </div>
            <ShieldCheck size={17} style={{ color: "var(--ml-accent)", flexShrink: 0 }} />
          </div>
          <form action={signOutAction}>
            <button type="submit" className="sidebar-link sidebar-signout">
              <LogOut size={17} className="icon" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
