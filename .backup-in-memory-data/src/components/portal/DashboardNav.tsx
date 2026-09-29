"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
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
      { href: "/dashboard/requests", label: "Appointment Requests", icon: Inbox },
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
    items: [{ href: "/dashboard/profile", label: "Public Profile", icon: UserRound }],
  },
  {
    label: "Account",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }],
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") === "pattern" ? "pattern" : "week";

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

              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-brand-gradient font-semibold text-primary-foreground shadow-sm"
                        : "text-sidebar-fg hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                    {hasSubItems && (
                      <ChevronDown
                        className={`ml-auto size-4 opacity-70 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
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
                                ? "bg-white/[0.08] font-semibold text-white"
                                : "text-sidebar-fg hover:bg-white/[0.06] hover:text-white"
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
