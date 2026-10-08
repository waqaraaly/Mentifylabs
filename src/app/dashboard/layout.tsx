import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowUpRight, LogOut } from "lucide-react";
import { signOutAction } from "@/app/login/actions";
import { getCurrentPractitioner, isPubliclyVisible } from "@/data/practitioners";
import { getAppointmentsByPractitioner } from "@/data/appointments";
import { DashboardNav } from "@/components/portal/DashboardNav";
import { PortalAside } from "@/components/portal/PortalAside";
import { VerificationBanner } from "@/components/portal/VerificationBanner";
import { PortalTimeZoneProvider } from "@/components/portal/PortalTimeZone";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  // Live data from D1 on every request, never a copy prerendered at build time.
  await connection();
  const practitioner = await getCurrentPractitioner();
  // A practitioner who hasn't finished (or skipped) the guided first-login
  // setup never sees the portal itself — not even a glimpse of it.
  if (!practitioner.onboardedAt) redirect("/onboarding");
  const pendingRequests = await getAppointmentsByPractitioner(practitioner.slug, "pending");
  const initials = practitioner.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="app-backdrop min-h-screen lg:flex">
      <aside className="border-sidebar-border bg-sidebar text-sidebar-fg sticky top-0 z-30 max-h-dvh overflow-y-auto border-b-2 lg:flex lg:h-screen lg:w-[17rem] lg:shrink-0 lg:flex-col lg:border-r-2 lg:border-b-0">
        <PortalAside
          logo={
            // eslint-disable-next-line @next/next/no-img-element -- static local SVG, no optimization needed
            <img src="/brand/mentifylabs-logo.svg" alt="Mentify Labs" className="h-10 w-auto lg:h-14" />
          }
        >
          <div className="border-t-2 border-sidebar-border px-3 pt-6 pb-6">
            <Suspense fallback={null}>
              <DashboardNav pendingRequests={pendingRequests.length} />
            </Suspense>
          </div>

          <div className="lg:flex-1" />

          <div className="flex items-center gap-3 border-t-2 border-sidebar-border px-6 py-6">
            <div className="ring-sidebar-border flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-xs font-semibold text-sidebar-active-fg ring-1">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-strong">{practitioner.fullName}</p>
              {/* A link to the page clients see, once there is one. Until the profile is live there is nothing to link to. */}
              {isPubliclyVisible(practitioner) && (
                <Link
                  href={`/${practitioner.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-sidebar-fg transition hover:text-sidebar-strong"
                >
                  Public profile
                  <ArrowUpRight className="size-3" aria-hidden />
                </Link>
              )}
            </div>
            <form action={signOutAction} className="ml-auto">
              <button
                type="submit"
                title="Sign out"
                className="flex size-11 items-center justify-center rounded-lg text-sidebar-fg transition hover:bg-sidebar-active hover:text-sidebar-active-fg"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="sr-only">Sign out</span>
              </button>
            </form>
          </div>
        </PortalAside>
      </aside>

      <main className="min-w-0 flex-1 px-[clamp(15px,2.5vw,37.5px)] pt-6 pb-[17.6px] lg:pt-8">
        <PortalTimeZoneProvider zone={practitioner.timezone}>
          <VerificationBanner practitioner={practitioner} />
          {children}
        </PortalTimeZoneProvider>
      </main>
    </div>
  );
}
