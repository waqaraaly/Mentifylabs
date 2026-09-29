import { CalendarClock } from "lucide-react";
import { getCurrentPractitioner } from "@/data/practitioners";
import { getAppointmentsByPractitioner } from "@/data/appointments";
import { getOpenSlotsByPractitioner } from "@/data/slots";
import type { AppointmentStatus } from "@/types/appointment";
import { SessionsAgenda } from "@/components/portal/SessionsAgenda";
import { ScheduleSessionButton } from "@/components/portal/ScheduleSessionModal";
import { AutoRefresh } from "@/components/portal/AutoRefresh";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "Sessions" };

const TAB_STATUS: Record<string, AppointmentStatus> = {
  upcoming: "confirmed",
  completed: "completed",
  cancelled: "cancelled",
};

type Props = PageProps<"/dashboard/sessions">;

export default async function SessionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab = tabParam && tabParam in TAB_STATUS ? tabParam : "upcoming";
  const status = TAB_STATUS[tab];

  const practitioner = await getCurrentPractitioner();
  const [all, filtered, openSlots] = await Promise.all([
    getAppointmentsByPractitioner(practitioner.slug),
    getAppointmentsByPractitioner(practitioner.slug, status),
    getOpenSlotsByPractitioner(practitioner.slug),
  ]);

  const counts = {
    upcoming: all.filter((a) => a.status === "confirmed").length,
    completed: all.filter((a) => a.status === "completed").length,
    cancelled: all.filter((a) => a.status === "cancelled").length,
  };

  const sorted = [...filtered].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-1 pb-8 sm:px-3">
      <AutoRefresh seconds={60} />

      <PageHeader
        icon={CalendarClock}
        title="Sessions"
        description="Every booking, from upcoming to closed."
        actions={<ScheduleSessionButton practitionerSlug={practitioner.slug} openSlots={openSlots} />}
      />

      <SessionsAgenda
        appointments={sorted}
        tab={tab}
        practitionerSlug={practitioner.slug}
        openSlots={openSlots}
        tabItems={[
          { value: "upcoming", label: "Upcoming", count: counts.upcoming },
          { value: "completed", label: "Completed", count: counts.completed },
          { value: "cancelled", label: "Cancelled", count: counts.cancelled },
        ]}
      />
    </div>
  );
}
