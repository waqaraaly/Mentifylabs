import type { Practitioner } from "@/types/practitioner";
import { verificationState } from "@/lib/verification";

/** Someone whose credentials were sent back and who has not submitted again. They are waiting on the practitioner, not on Super Admin. */
export const isSentBack = (p: Pick<Practitioner, "status" | "verificationStatus" | "verificationNote">): boolean =>
  p.status === "active" && verificationState(p) === "rejected";

export interface SentBackInfo {
  /** When the most recent send-back happened. */
  at: string;
  /** How many times credentials have been sent back in total. */
  rounds: number;
}

/** From the recorded decisions: the latest send-back date and the number of rounds, per practitioner. */
export function sentBackInfo(events: { slug: string; kind: string; at: string }[]): Map<string, SentBackInfo> {
  const info = new Map<string, SentBackInfo>();
  for (const e of events) {
    if (e.kind !== "verification_rejected") continue;
    const current = info.get(e.slug);
    info.set(e.slug, { at: !current || e.at > current.at ? e.at : current.at, rounds: (current?.rounds ?? 0) + 1 });
  }
  return info;
}
