/** How much a practitioner can write in each box, and how many suggestions they can send in a day. */
export const SUGGESTION_MAX_LENGTH = 2000;
export const SUGGESTIONS_PER_DAY = 10;

export type SuggestionInput = { ok: true; improve?: string; features?: string } | { ok: false; error: string };

const tidy = (value: FormDataEntryValue | string | null | undefined) =>
  (value?.toString() ?? "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

/** The two answers, tidied. At least one is needed, and neither can be longer than the limit. */
export function parseSuggestion(improve: FormDataEntryValue | null, features: FormDataEntryValue | null): SuggestionInput {
  const a = tidy(improve);
  const b = tidy(features);
  if (!a && !b) return { ok: false, error: "Write something in at least one of the boxes." };
  if (a.length > SUGGESTION_MAX_LENGTH || b.length > SUGGESTION_MAX_LENGTH) {
    return { ok: false, error: `Please keep each answer under ${SUGGESTION_MAX_LENGTH.toLocaleString("en-US")} characters.` };
  }
  return { ok: true, improve: a || undefined, features: b || undefined };
}
