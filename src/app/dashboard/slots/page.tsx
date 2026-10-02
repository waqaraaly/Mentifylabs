import { getCurrentPractitioner } from "@/data/practitioners";
import { getSlotsByPractitioner } from "@/data/slots";
import { getAppointmentsByPractitioner } from "@/data/appointments";
import { generateUpcomingSlots, getWeeklyRules, getDayOverride, getDayOverrides } from "@/data/availability";
import type { DayOverride } from "@/types/availability";
import type { Slot } from "@/types/slot";
import { addDays, formatMonthLabel, mondayOf, monthOf, todayIsoDate } from "@/lib/format";
import { ManageSlotsBoard } from "@/components/portal/ManageSlotsBoard";

type Props = PageProps<"/dashboard/slots">;

export default async function ManageSlotsPage({ searchParams }: Props) {
  const practitioner = await getCurrentPractitioner();

  // Keep the rolling calendar filled from her weekly pattern before we read it.
  await generateUpcomingSlots(practitioner.slug);

  const today = todayIsoDate();
  const params = await searchParams;
  const dateParam = Array.isArray(params.date) ? params.date[0] : params.date;
  const selectedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

  const viewParam = Array.isArray(params.view) ? params.view[0] : params.view;
  const view: "week" | "pattern" = viewParam === "pattern" ? "pattern" : "week";

  const weekStart = mondayOf(selectedDate);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const prevHref = `/dashboard/slots?date=${addDays(weekStart, -7)}`;
  const nextHref = `/dashboard/slots?date=${addDays(weekStart, 7)}`;

  const monthLabel = formatMonthLabel(monthOf(weekDates[0]));

  const [slots, appointments, weeklyRules, overrides, allOverrides] = await Promise.all([
    getSlotsByPractitioner(practitioner.slug),
    getAppointmentsByPractitioner(practitioner.slug),
    getWeeklyRules(practitioner.slug),
    Promise.all(weekDates.map((date) => getDayOverride(practitioner.slug, date))),
    getDayOverrides(practitioner.slug),
  ]);

  const customDates = allOverrides.filter((o) => o.date >= today);
  const customDateSlots: Record<string, Slot[]> = {};
  for (const o of customDates) {
    customDateSlots[o.date] = slots
      .filter((s) => s.date === o.date && s.status !== "unavailable")
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const days = weekDates.map((date) => ({
    date,
    slots: slots.filter((s) => s.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  const appointmentBySlotId = new Map(
    appointments.filter((a) => a.slotId).map((a) => [a.slotId as string, a]),
  );

  const dayOverrideByDate = new Map<string, DayOverride>(
    weekDates
      .map((date, i) => [date, overrides[i]] as const)
      .filter((entry): entry is [string, DayOverride] => entry[1] !== null),
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-2 pb-12 sm:px-4">
      <ManageSlotsBoard
        monthLabel={monthLabel}
        selectedDate={selectedDate}
        prevHref={prevHref}
        nextHref={nextHref}
        view={view}
        days={days}
        practitionerSlug={practitioner.slug}
        appointmentBySlotId={appointmentBySlotId}
        weeklyRules={weeklyRules}
        dayOverrideByDate={dayOverrideByDate}
        customDates={customDates}
        customDateSlots={customDateSlots}
      />
    </div>
  );
}
