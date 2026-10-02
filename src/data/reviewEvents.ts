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

/** Newest first. */
export async function getReviewEvents(slug: string): Promise<ReviewEvent[]> {
  const rows = await all<ReviewEventRow>(
    "SELECT * FROM review_events WHERE practitioner_slug = ? ORDER BY created_at DESC, rowid DESC",
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
