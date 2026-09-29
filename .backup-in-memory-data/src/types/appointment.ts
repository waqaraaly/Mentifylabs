export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  /** Stable identifier for the client, shown to Super Admin — not exposed publicly. */
  clientId: string;
  practitionerSlug: string;
  slotId: string | null;
  clientName: string;
  clientContact: string;
  concern?: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionType: "online" | "offline";
  status: AppointmentStatus;
  createdAt: string;
}
