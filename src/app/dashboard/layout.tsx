import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { signOutAction } from "@/app/login/actions";
import { getCurrentPractitioner } from "@/data/practitioners";
import { getAppointmentsByPractitioner } from "@/data/appointments";
import { AccountMenu } from "@/components/portal/AccountMenu";
import { DashboardNav } from "@/components/portal/DashboardNav";
import { HideOnSuggestions } from "@/components/portal/HideOnSuggestions";
import { PortalAside } from "@/components/portal/PortalAside";
import { VerificationBanner } from "@/components/portal/VerificationBanner";
import { PortalTimeZoneProvider } from "@/components/portal/PortalTimeZone";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  // Live data from D1 on every request, never a copy prerendered at build time.
  await connection();
  const practitioner = await getCurrentPractitioner();
  // A practitioner who hasn't finished (or skipped) the guided first-login
  // setup never sees the portal itself — not even a glimpse of it.
  if (!practitioner.onboardedAt) redirect("/onboarding");
  const pendingRequests = await getAppointmentsByPractitioner(
    practitioner.slug,
    "pending",
  );

  return (
    <div className="app-backdrop min-h-screen lg:flex">
      <HideOnSuggestions>
        <aside className="border-sidebar-border bg-sidebar text-sidebar-fg sticky top-0 z-30 max-h-dvh overflow-y-auto border-b-2 lg:flex lg:h-screen lg:w-[17rem] lg:shrink-0 lg:flex-col lg:border-r-2 lg:border-b-0">
          <PortalAside
            logo={
              // eslint-disable-next-line @next/next/no-img-element -- static local SVG, no optimization needed
              <img
                src="/brand/mentifylabs-logo.svg"
                alt="Mentify Labs"
                className="h-10 w-auto lg:h-14"
              />
            }
          >
            <div className="border-t-2 border-sidebar-border px-3 pt-6 pb-6">
              <Suspense fallback={null}>
                <DashboardNav pendingRequests={pendingRequests.length} />
              </Suspense>
            </div>

            <div className="lg:flex-1" />

            {/* The name at the foot opens a small menu upwards: the suggestion form, and signing out. */}
            <AccountMenu name={practitioner.fullName} photoUrl={practitioner.photoUrl} signOutAction={signOutAction} />
          </PortalAside>
        </aside>
      </HideOnSuggestions>

      <main className="min-w-0 flex-1 px-[clamp(15px,2.5vw,37.5px)] pt-6 pb-[17.6px] lg:pt-8">
        <PortalTimeZoneProvider zone={practitioner.timezone}>
          <VerificationBanner practitioner={practitioner} />
          {children}
        </PortalTimeZoneProvider>
      </main>
    </div>
  );
}
