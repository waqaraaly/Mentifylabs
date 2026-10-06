import type { Practitioner } from "@/types/practitioner";
import { getAllPractitioners } from "@/data/practitioners";
import { getReviewTimeline } from "@/data/reviewEvents";
import { isAwaitingApproval } from "@/lib/verification";
import { isSentBack, sentBackInfo } from "@/lib/reviewQueue";

const DAY = 24 * 60 * 60 * 1000;

export interface SentBackRow {
  p: Practitioner;
  /** When it was sent back, if that was recorded. */
  sentBackAt?: string;
  rounds: number;
  /** Days since it was sent back. */
  waitingDays: number | null;
}

/** When this practitioner's credentials were sent back, how long ago, and how many times, for their review page. */
export async function getSentBackFor(slug: string): Promise<{ at: string; rounds: number; waitingDays: number } | undefined> {
  const info = sentBackInfo(await getReviewTimeline()).get(slug);
  return info ? { ...info, waitingDays: Math.floor((Date.now() - Date.parse(info.at)) / DAY) } : undefined;
}

/** The two lists on the Credential review page: waiting on Super Admin, and sent back and waiting on the practitioner. */
export async function getCredentialQueue(): Promise<{ awaiting: Practitioner[]; sentBack: SentBackRow[] }> {
  const [practitioners, events] = await Promise.all([getAllPractitioners(), getReviewTimeline()]);
  const info = sentBackInfo(events);
  const now = Date.now();

  // Longest wait first, in both lists.
  const awaiting = practitioners
    .filter(isAwaitingApproval)
    .sort((a, b) => (a.verificationSubmittedAt ?? "").localeCompare(b.verificationSubmittedAt ?? ""));

  const sentBack = practitioners
    .filter(isSentBack)
    .map((p): SentBackRow => {
      const i = info.get(p.slug);
      return { p, sentBackAt: i?.at, rounds: Math.max(1, i?.rounds ?? 1), waitingDays: i ? Math.floor((now - Date.parse(i.at)) / DAY) : null };
    })
    .sort((a, b) => (a.sentBackAt ?? "9999").localeCompare(b.sentBackAt ?? "9999"));

  return { awaiting, sentBack };
}
