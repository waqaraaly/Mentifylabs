"use server";

import { getCurrentPractitioner } from "@/data/practitioners";
import { countRecentSuggestions, createSuggestion } from "@/data/suggestions";
import { revalidateAdminViews } from "@/lib/revalidate";
import { parseSuggestion, SUGGESTIONS_PER_DAY } from "@/lib/suggestionRules";

export interface SuggestionFormState {
  error?: string;
  sent?: boolean;
  /** What they typed, handed back with an error so nothing they wrote is lost. */
  values?: { improve: string; features: string };
}

/** Saves what the signed-in practitioner wrote, for Super Admin to read. */
export async function submitSuggestionAction(_prev: SuggestionFormState, formData: FormData): Promise<SuggestionFormState> {
  const practitioner = await getCurrentPractitioner();

  const typed = { improve: formData.get("improve")?.toString() ?? "", features: formData.get("features")?.toString() ?? "" };
  const parsed = parseSuggestion(typed.improve, typed.features);
  if (!parsed.ok) return { error: parsed.error, values: typed };

  if ((await countRecentSuggestions(practitioner.slug)) >= SUGGESTIONS_PER_DAY) {
    return { error: "You have sent a lot of suggestions today. Please try again tomorrow.", values: typed };
  }

  await createSuggestion(practitioner.slug, parsed.improve, parsed.features);
  revalidateAdminViews();
  return { sent: true };
}
