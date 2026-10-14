"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { submitSuggestionAction, type SuggestionFormState } from "@/app/dashboard/suggestions/actions";
import { SUGGESTION_MAX_LENGTH } from "@/lib/suggestionRules";

const box =
  "mt-2.5 block min-h-36 w-full resize-y rounded-xl bg-black/[0.025] px-4 py-3.5 text-[15px] leading-relaxed outline-none ring-1 ring-transparent transition placeholder:text-muted/70 focus:bg-surface focus:ring-primary/40";

/** Two open questions and one button. Neither box is required on its own, but one of them has to have something in it. */
export function SuggestionForm() {
  const [state, formAction, pending] = useActionState<SuggestionFormState, FormData>(submitSuggestionAction, {});

  return (
    <form action={formAction} className="space-y-8">
      <div>
        <label htmlFor="improve" className="text-base font-semibold tracking-tight">
          How can we improve the platform?
        </label>
        <textarea
          id="improve"
          name="improve"
          defaultValue={state.values?.improve}
          maxLength={SUGGESTION_MAX_LENGTH}
          placeholder="Anything that is slow, confusing or missing. A few words is plenty."
          className={box}
        />
      </div>

      <div>
        <label htmlFor="features" className="text-base font-semibold tracking-tight">
          What new features would you like to see?
        </label>
        <textarea
          id="features"
          name="features"
          defaultValue={state.values?.features}
          maxLength={SUGGESTION_MAX_LENGTH}
          placeholder="Something you wish MentifyLabs could do for you or your clients."
          className={box}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send suggestion"}
        </button>
        {state.error && (
          <p role="alert" className="text-sm font-medium text-alert">
            {state.error}
          </p>
        )}
        {state.sent && !pending && (
          <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Check className="size-4" aria-hidden />
            Thank you. We read every suggestion.
          </p>
        )}
      </div>
    </form>
  );
}
