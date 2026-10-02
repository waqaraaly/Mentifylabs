import { Inbox } from "lucide-react";
import { getCurrentPractitioner } from "@/data/practitioners";
import { getAppointmentsByPractitioner } from "@/data/appointments";
import { getOpenSlotsByPractitioner } from "@/data/slots";
import { RequestsQueue } from "@/components/portal/RequestsQueue";
import { AutoRefresh } from "@/components/portal/AutoRefresh";
import { PageHeader } from "@/components/ui/PageHeader";
import { todayIsoDate } from "@/lib/format";

export const metadata = { title: "Appointment Requests" };

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default async function AppointmentRequestsPage() {
  const practitioner = await getCurrentPractitioner();
  const [inquiries, openSlots] = await Promise.all([
    getAppointmentsByPractitioner(practitioner.slug, "pending"),
    getOpenSlotsByPractitioner(practitioner.slug),
  ]);

  const today = todayIsoDate();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // A request whose session time has already gone by can't be honoured as asked.
  const isExpired = (a: (typeof inquiries)[number]) =>
    a.date < today || (a.date === today && toMinutes(a.endTime) <= nowMinutes);

  // Triage order: soonest requested session first, expired ones sink to the end.
  const sorted = [...inquiries].sort((a, b) => {
    const ae = isExpired(a) ? 1 : 0;
    const be = isExpired(b) ? 1 : 0;
    if (ae !== be) return ae - be;
    return (a.date + a.startTime).localeCompare(b.date + b.startTime);
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-2 pb-12 sm:px-4">
      <AutoRefresh seconds={60} />

      <PageHeader
        icon={Inbox}
        title="Appointment requests"
        description={
          sorted.length === 0
            ? "New booking inquiries from clients will show up here."
            : `${sorted.length} request${sorted.length > 1 ? "s" : ""} waiting for your response.`
        }
      />

      <RequestsQueue requests={sorted} practitionerSlug={practitioner.slug} openSlots={openSlots} />
    </div>
  );
}
