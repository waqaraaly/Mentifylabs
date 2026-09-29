import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { getCurrentPractitioner } from "@/data/practitioners";
import { DashboardNav } from "@/components/portal/DashboardNav";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
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
          <img src="/brand/mentifylabs-logo-light.svg" alt="Mentify Labs" className="h-14 w-auto" />
        </div>

        <div className="border-t border-white/[0.08] px-3 pt-6 pb-6">
          <Suspense fallback={null}>
            <DashboardNav />
          </Suspense>
        </div>

        <div className="lg:flex-1" />

        <div className="flex items-center gap-3 border-t border-white/[0.08] px-6 py-6">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{practitioner.fullName}</p>
            <Link
              href={`/${practitioner.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-sidebar-fg transition hover:text-white"
            >
              Public profile
              <ArrowUpRight className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-[clamp(15px,2.5vw,37.5px)] pt-8 pb-[17.6px]">{children}</main>
    </div>
  );
}
