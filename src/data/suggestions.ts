import { all, first, run } from "@/lib/db";

export type SuggestionStatus = "new" | "reviewed";

export interface Suggestion {
  id: string;
  practitionerSlug: string;
  practitionerName: string;
  practitionerTitle: string;
  practitionerEmail: string;
  improve?: string;
  features?: string;
  status: SuggestionStatus;
  createdAt: string;
}

interface SuggestionRow {
  id: string;
  practitioner_slug: string;
  full_name: string;
  professional_title: string;
  email: string;
  improve: string | null;
  features: string | null;
  status: SuggestionStatus;
  created_at: string;
}

export async function createSuggestion(slug: string, improve?: string, features?: string): Promise<void> {
  await run("INSERT INTO suggestions (practitioner_slug, improve, features) VALUES (?, ?, ?)", slug, improve ?? null, features ?? null);
}

/** How many this practitioner has sent in the last 24 hours, so one account cannot flood the list. */
export async function countRecentSuggestions(slug: string): Promise<number> {
  const row = await first<{ n: number }>(
    "SELECT COUNT(*) AS n FROM suggestions WHERE practitioner_slug = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')",
    slug,
  );
  return row?.n ?? 0;
}

/** Newest first, with who sent each one. */
export async function getAllSuggestions(): Promise<Suggestion[]> {
  const rows = await all<SuggestionRow>(
    `SELECT s.id, s.practitioner_slug, p.full_name, p.professional_title, p.email, s.improve, s.features, s.status, s.created_at
       FROM suggestions s JOIN practitioners p ON p.slug = s.practitioner_slug
      ORDER BY s.created_at DESC, s.rowid DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    practitionerSlug: r.practitioner_slug,
    practitionerName: r.full_name,
    practitionerTitle: r.professional_title,
    practitionerEmail: r.email,
    improve: r.improve ?? undefined,
    features: r.features ?? undefined,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function countNewSuggestions(): Promise<number> {
  const row = await first<{ n: number }>("SELECT COUNT(*) AS n FROM suggestions WHERE status = 'new'");
  return row?.n ?? 0;
}

export async function setSuggestionStatus(id: string, status: SuggestionStatus): Promise<void> {
  await run("UPDATE suggestions SET status = ? WHERE id = ?", status, id);
}
