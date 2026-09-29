import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowUpRight, LogOut } from "lucide-react";
import { signOutAction } from "@/app/login/actions";
import { getCurrentPractitioner } from "@/data/practitioners";
import { DashboardNav } from "@/components/portal/DashboardNav";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  // Live data from D1 on every request, never a copy prerendered at build time.
  await connection();
  const practitioner = await getCurrentPractitioner();
  const initials = practitioner.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="app-backdrop min-h-screen lg:flex">
      <aside className="bg-sidebar text-sidebar-fg lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:overflow-y-auto">
        <div className="px-6 py-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no optimization needed */}
          <img src="/brand/mentifylabs-logo.svg" alt="Mentify Labs" className="h-14 w-auto" />
        </div>

        <div className="border-t border-sidebar-border px-3 pt-6 pb-6">
          <Suspense fallback={null}>
            <DashboardNav />
          </Suspense>
        </div>

        <div className="lg:flex-1" />

        <div className="flex items-center gap-3 border-t border-sidebar-border px-6 py-6">
          <div className="ring-sidebar-border flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-xs font-semibold text-sidebar-active-fg ring-1">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-strong">{practitioner.fullName}</p>
            <Link
              href={`/${practitioner.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-sidebar-fg transition hover:text-sidebar-strong"
            >
              Public profile
              <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          </div>
          <form action={signOutAction} className="ml-auto">
            <button
              type="submit"
              title="Sign out"
              className="flex size-8 items-center justify-center rounded-lg text-sidebar-fg transition hover:bg-sidebar-active hover:text-sidebar-active-fg"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="sr-only">Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-[clamp(15px,2.5vw,37.5px)] pt-8 pb-[17.6px]">{children}</main>
    </div>
  );
}
