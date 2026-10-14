/** Open = white with a teal outline; booked = solid primary; requested = the pale honey accent, the app's "waiting" tone. */
export function slotChipClass(booked: boolean, requested = false) {
  if (requested) return "bg-accent text-accent-strong ring-1 ring-accent-strong/25";
  return booked
    ? "bg-primary text-primary-foreground"
    : "bg-surface text-primary ring-1 ring-primary/[0.45]";
}
