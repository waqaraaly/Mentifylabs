"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { initialsOf } from "@/lib/admin";
import {
  BarChart3,
  Calendar,
  Clock,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Settings,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { signOutAction } from "@/app/login/actions";

type CountKey = "practitioners" | "pending" | "bookingsToday";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Users;
  /** Which sidebar count to show beside the label. */
  countKey?: CountKey;
  /** A count of things waiting on Super Admin: shown only when above zero, and highlighted. */
  attention?: boolean;
}

// Grouped by what the admin is doing: the approval queue up top, then managing records, then the numbers.
const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/pending", label: "Pending approval", icon: Clock, countKey: "pending", attention: true },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/admin/practitioners", label: "Practitioners", icon: Users, countKey: "practitioners" },
      { href: "/admin/bookings", label: "Appointments", icon: Calendar, countKey: "bookingsToday" },
      { href: "/admin/users", label: "Manage Users", icon: UserCog },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/profile-stats", label: "Profile stats", icon: LineChart },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];


export interface SidebarCounts {
  practitioners: number;
  pending: number;
  bookingsToday: number;
}

export function Sidebar({ counts, admin }: { counts: SidebarCounts; admin: { name: string; email: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  const renderLink = (item: NavItem) => {
    const active = isActive(item.href);
    const count = item.countKey ? counts[item.countKey] : undefined;
    // Review-queue counts only matter when something is waiting.
    const showCount = count !== undefined && (!item.attention || count > 0);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={"sidebar-link" + (active ? " active" : "")}
      >
        <item.icon size={18} className="icon" strokeWidth={1.8} />
        <span>{item.label}</span>
        {showCount && <span className={"count tnum" + (item.attention ? " attention" : "")}>{count}</span>}
      </Link>
    );
  };

  return (
    <aside className="shell-sidebar">
      <div className="shell-sidebar-inner">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no optimization needed */}
            <img src="/brand/mentifylabs-logo.svg" alt="MentifyLabs" className="sidebar-logo" />
          </div>
          <button
            type="button"
            className="sidebar-menu-btn"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="admin-menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>

        <div
          id="admin-menu"
          className={"sidebar-body" + (open ? " open" : "")}
          // Tapping any link closes the menu on small screens; the page navigates as usual.
          onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
        >
          <nav className="sidebar-nav" aria-label="Super Admin">
            {GROUPS.map((group) => (
              <div key={group.label} className="nav-group-block">
                <div className="nav-group">{group.label}</div>
                {group.items.map(renderLink)}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-profile">
              <div className="avatar avatar-md" style={{ background: "var(--ml-sidebar-active)", color: "var(--ml-sidebar-active-fg)", boxShadow: "0 0 0 1px var(--ml-sidebar-border)", border: "none", fontWeight: 600 }}>
                {initialsOf(admin.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sidebar-profile-name truncate">{admin.name}</div>
                <div className="sidebar-profile-email truncate">Super Admin</div>
              </div>
            </div>
            <form action={signOutAction}>
              <button type="submit" className="sidebar-signout" title="Sign out">
                <LogOut size={16} />
                <span className="sr-only">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}
