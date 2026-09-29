import type { SlotSessionType } from "@/lib/sessionType";

export type SlotStatus = "open" | "booked" | "unavailable";

export interface Slot {
  id: string;
  practitionerSlug: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionType: SlotSessionType;
  status: SlotStatus;
}
