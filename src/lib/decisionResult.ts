/** What an admin decision on a submission reports back, so the page never claims a result that didn't happen. */
export type DecisionResult = { ok: true; emailSent: boolean } | { ok: false; message: string };

/**
 * Shows the real outcome as a toast. Returns whether the decision went through. An email that couldn't be sent is
 * called out separately: the decision stands, but the practitioner hasn't been told.
 */
export function reportDecision(
  result: DecisionResult,
  toast: (msg: string, kind?: "ok" | "danger" | "info") => void,
  success: { message: string; kind?: "ok" | "danger" },
): boolean {
  if (!result.ok) {
    toast(result.message, "danger");
    return false;
  }
  toast(success.message, success.kind ?? "ok");
  if (!result.emailSent) toast("The email to the practitioner could not be sent, so let them know yourself.", "danger");
  return true;
}
