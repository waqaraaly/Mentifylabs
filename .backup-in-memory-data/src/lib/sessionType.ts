/** What a slot offers: one format, or "both" — the client picks Online or On-Site when booking. */
export type SlotSessionType = "online" | "offline" | "both";
export type BookedSessionType = "online" | "offline";

export const SLOT_SESSION_TYPES: SlotSessionType[] = ["online", "offline", "both"];

export function parseSlotSessionType(value: string | undefined | null): SlotSessionType | undefined {
  return SLOT_SESSION_TYPES.find((t) => t === value);
}

export function parseBookedSessionType(value: string | undefined | null): BookedSessionType | undefined {
  return value === "online" || value === "offline" ? value : undefined;
}

/** The concrete format an appointment gets from a slot — for "both" slots, whatever the client chose. */
export function resolveSessionType(slotType: SlotSessionType, chosen?: BookedSessionType): BookedSessionType {
  return slotType === "both" ? (chosen ?? "online") : slotType;
}

export function sessionTypeLabel(type: SlotSessionType): string {
  return type === "online" ? "Online" : type === "offline" ? "On-Site" : "Client's choice";
}
