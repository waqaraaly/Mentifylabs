import type { Appointment } from "@/types/appointment";

/** Where a booking stands, in words. The data holds no timestamps for state changes, so there are none here either. */
export const STATE_STEP: Record<Appointment["status"], { label: string; tone: string }> = {
  pending: { label: "Awaiting the practitioner's response", tone: "var(--ml-warn)" },
  confirmed: { label: "Confirmed by the practitioner", tone: "var(--ml-ok)" },
  completed: { label: "Session completed", tone: "var(--ml-info)" },
  cancelled: { label: "Cancelled", tone: "var(--ml-danger)" },
};
