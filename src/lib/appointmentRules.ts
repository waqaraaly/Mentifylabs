import type { AppointmentStatus } from "@/types/appointment";

/**
 * Which appointments can move to which status. The Sessions screens only offer these moves, but a second tab left open
 * on an old view, or a request made by hand, can ask for any other, so the server checks them too. The one that
 * matters most is cancelled -> confirmed: cancelling frees the slot, so confirming afterwards would let a client book
 * the same time again.
 */
export const STATUS_MOVES = {
  confirmed: ["pending"],
  cancelled: ["pending", "confirmed"],
  completed: ["confirmed"],
} as const satisfies Record<string, readonly AppointmentStatus[]>;

export type MovableStatus = keyof typeof STATUS_MOVES;

/** Only a record that is over can be deleted. A live appointment is cancelled, which frees its slot. */
export const DELETABLE_FROM: readonly AppointmentStatus[] = ["cancelled", "completed"];

/** Only a live appointment can be moved to another time. */
export const RESCHEDULABLE_FROM: readonly AppointmentStatus[] = ["pending", "confirmed"];

/**
 * Whether the time still allows the move. A request whose time has gone can't be accepted as it stands (it can be moved
 * or declined), and a session can't be marked complete before it has started. `started` is judged on the practitioner's clock.
 */
export function timeAllows(to: MovableStatus, started: boolean): boolean {
  if (to === "confirmed") return !started;
  if (to === "completed") return started;
  return true;
}
