"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Inbox,
  LayoutDashboard,
  Repeat,
  Settings,
  UserRound,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Manage",
    items: [
      { href: "/dashboard/requests", label: "Appointment Requests", icon: Inbox, countKey: "pendingRequests" as const },
      { href: "/dashboard/sessions", label: "Sessions", icon: CalendarClock },
      {
        href: "/dashboard/slots",
        label: "Availability",
        icon: CalendarRange,
        subItems: [
          { href: "/dashboard/slots", label: "Calendar", icon: CalendarDays, view: "week" },
          { href: "/dashboard/slots?view=pattern", label: "Weekly hours", icon: Repeat, view: "pattern" },
        ],
      },
    ],
  },
  {
    // What clients see, kept apart from the private account below.
    label: "Your profile",
    items: [
      { href: "/dashboard/profile", label: "Public Profile", icon: UserRound },
      { href: "/dashboard/stats", label: "Profile Stats", icon: BarChart3 },
      { href: "/dashboard/verification", label: "Verification", icon: BadgeCheck },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }],
  },
];

export function DashboardNav({ pendingRequests = 0 }: { pendingRequests?: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") === "pattern" ? "pattern" : "week";
  const counts: Record<string, number> = { pendingRequests };

  return (
    <nav className="space-y-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-xs font-medium tracking-[0.1em] text-sidebar-fg/60 uppercase">
            {group.label}
          </p>
          <div className="mt-2 space-y-1">
            {group.items.map((item) => {
              const isActive =
                item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              const hasSubItems = "subItems" in item && !!item.subItems;
              const expanded = hasSubItems && isActive;
              const count = "countKey" in item && item.countKey ? counts[item.countKey] : undefined;

              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "ring-sidebar-border bg-sidebar-active font-semibold text-sidebar-active-fg shadow-sm ring-1"
                        : "text-sidebar-fg hover:bg-sidebar-active hover:text-sidebar-active-fg"
                    }`}
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                    {!!count && (
                      <span
                        className={`ml-auto rounded-full px-1.5 py-0.5 text-xs leading-none font-semibold tabular-nums ${
                          isActive ? "bg-sidebar-active-fg/15 text-sidebar-active-fg" : "bg-sidebar-border text-sidebar-strong"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                    {hasSubItems && (
                      <ChevronDown
                        className={`${count ? "" : "ml-auto"} size-4 opacity-70 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    )}
                  </Link>

                  {expanded && (
                    <div className="mt-1 space-y-0.5 pl-3">
                      {item.subItems!.map((sub) => {
                        const subActive = currentView === sub.view;
                        return (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                              subActive
                                ? "ring-sidebar-border bg-sidebar-active font-semibold text-sidebar-active-fg ring-1"
                                : "text-sidebar-fg hover:bg-sidebar-active hover:text-sidebar-active-fg"
                            }`}
                          >
                            <sub.icon className="size-3.5" aria-hidden />
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
