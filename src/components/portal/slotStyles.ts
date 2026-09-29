/** Open = white with a teal outline; booked = solid primary. */
export function slotChipClass(booked: boolean) {
  return booked
    ? "bg-primary text-primary-foreground"
    : "bg-surface text-primary ring-1 ring-primary/[0.45]";
}
