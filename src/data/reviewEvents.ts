import { all, run } from "@/lib/db";
import type { ReviewEvent, ReviewEventKind } from "@/types/reviewEvent";

interface ReviewEventRow {
  id: string;
  practitioner_slug: string;
  kind: ReviewEventKind;
  note: string | null;
  actor_name: string | null;
  created_at: string;
}

/** Appends to the audit trail. Never throws: a logging problem must not undo the decision it describes. */
export async function recordReviewEvent(
  slug: string,
  kind: ReviewEventKind,
  opts: { note?: string; actorName?: string } = {},
): Promise<void> {
  try {
    await run(
      "INSERT INTO review_events (practitioner_slug, kind, note, actor_name) VALUES (?, ?, ?, ?)",
      slug,
      kind,
      opts.note?.trim() || null,
      opts.actorName || null,
    );
  } catch (error) {
    console.error(`[audit] Could not record ${kind} for ${slug}:`, error);
  }
}

/**
 * Newest first. Old "account approved" entries are left out: accounts are active from sign-up now, so that was never
 * a decision anyone makes. The rows stay in the table; they are just not shown as admin actions.
 */
export async function getReviewEvents(slug: string): Promise<ReviewEvent[]> {
  const rows = await all<ReviewEventRow>(
    "SELECT * FROM review_events WHERE practitioner_slug = ? AND kind <> 'account_approved' ORDER BY created_at DESC, rowid DESC",
    slug,
  );
  return rows.map((r) => ({
    id: r.id,
    practitionerSlug: r.practitioner_slug,
    kind: r.kind,
    note: r.note ?? undefined,
    actorName: r.actor_name ?? undefined,
    createdAt: r.created_at,
  }));
}

/** Every credential submission and decision, for the Reports page's review timings. */
export async function getReviewTimeline(): Promise<{ slug: string; kind: ReviewEventKind & ("verification_submitted" | "verification_approved" | "verification_rejected"); at: string }[]> {
  const rows = await all<{ practitioner_slug: string; kind: ReviewEventKind; created_at: string }>(
    "SELECT practitioner_slug, kind, created_at FROM review_events WHERE kind IN ('verification_submitted', 'verification_approved', 'verification_rejected') ORDER BY created_at",
  );
  return rows.map((r) => ({
    slug: r.practitioner_slug,
    kind: r.kind as "verification_submitted" | "verification_approved" | "verification_rejected",
    at: r.created_at,
  }));
}
