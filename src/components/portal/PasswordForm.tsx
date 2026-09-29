"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordFormState } from "@/app/dashboard/settings/actions";
import { Field } from "./Field";
import { settingsInputClass } from "./SettingsRow";

const initialState: PasswordFormState = { status: "idle", message: "" };

/** The password form's body and footer; the Settings page supplies the card and its header. */
export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <div className="flex-1 space-y-5 px-6 py-6">
        <Field label="Current password" htmlFor="currentPassword">
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            className={settingsInputClass}
          />
        </Field>
        <Field label="New password" htmlFor="newPassword">
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className={settingsInputClass}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className={settingsInputClass}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-black/[0.06] px-6 py-4">
        {state.status !== "idle" ? (
          <p className={`text-sm font-medium ${state.status === "success" ? "text-success" : "text-alert"}`}>
            {state.message}
          </p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
