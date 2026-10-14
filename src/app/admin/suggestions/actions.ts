"use server";

import { setSuggestionStatus, type SuggestionStatus } from "@/data/suggestions";
import { revalidateAdminViews } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/session";

/** Marks one suggestion as reviewed, or back to new. */
export async function setSuggestionStatusAction(id: string, status: SuggestionStatus) {
  await requireAdmin();
  if (status !== "new" && status !== "reviewed") return;
  await setSuggestionStatus(id, status);
  revalidateAdminViews();
}
