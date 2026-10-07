"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  disableTwoFactorAction,
  enableTwoFactorAction,
  requestTwoFactorCodeAction,
} from "@/app/dashboard/settings/twoFactorActions";
import { Field } from "./Field";
import { settingsInputClass } from "./SettingsRow";

/**
 * The body and footer of the two-step sign-in card; the Settings page supplies the card and its header.
 * Nothing is asked until a code has been emailed. Then the code, and to turn it off, the password too.
 */
export function TwoStepSignIn({ enabled, email }: { enabled: boolean; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const reset = () => {
    setCodeSent(false);
    setCode("");
    setPassword("");
  };

  const sendCode = () =>
    startTransition(async () => {
      const result = await requestTwoFactorCodeAction(enabled ? "disable" : "enable");
      setNote({ ok: result.ok, text: result.message });
      if (result.ok) setCodeSent(true);
    });

  const confirm = () =>
    startTransition(async () => {
      const result = enabled ? await disableTwoFactorAction(password, code) : await enableTwoFactorAction(code);
      setNote({ ok: result.ok, text: result.message });
      if (result.ok) {
        reset();
        router.refresh();
      }
    });

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-5 px-6 py-6">
        <p className="max-w-xl text-sm leading-relaxed text-muted">
          {enabled ? (
            <>
              After your password, a code sent to <span className="font-medium break-all text-foreground">{email}</span> is
              needed to sign in.
            </>
          ) : (
            <>
              After your password, we email a code to <span className="font-medium break-all text-foreground">{email}</span> and
              you enter it to sign in. Turning it on signs you out of your other devices.
            </>
          )}
        </p>

        {codeSent && (
          <div className="max-w-sm space-y-5">
            {enabled && (
              <Field label="Your password" htmlFor="twoStepPassword">
                <input
                  id="twoStepPassword"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={settingsInputClass}
                />
              </Field>
            )}
            <Field label="Code from the email" htmlFor="twoStepCode">
              <input
                id="twoStepCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={9}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={settingsInputClass}
              />
              <p className="mt-1.5 text-xs text-muted">6 digits. It works once and expires in 10 minutes.</p>
            </Field>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.06] px-6 py-4">
        {note ? (
          <p role="status" className={`text-sm font-medium ${note.ok ? "text-success" : "text-alert"}`}>
            {note.text}
          </p>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-3">
          {codeSent ? (
            <>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  reset();
                  setNote(null);
                }}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition hover:text-foreground disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={sendCode}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-primary transition hover:opacity-80 disabled:opacity-60"
              >
                Send a new code
              </button>
              <button
                type="button"
                disabled={pending || !code || (enabled && !password)}
                onClick={confirm}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {enabled ? "Turn off" : "Turn on"}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={sendCode}
              className={
                enabled
                  ? "rounded-lg px-6 py-2.5 text-sm font-semibold ring-1 ring-black/[0.14] transition hover:bg-black/[0.04] disabled:opacity-60"
                  : "rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              }
            >
              {pending ? "Sending…" : enabled ? "Turn off two-step sign-in" : "Turn on two-step sign-in"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
