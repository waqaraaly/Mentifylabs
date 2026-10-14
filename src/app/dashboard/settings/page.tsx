import { Check, Globe, KeyRound, Lock, Settings, ShieldCheck, User } from "lucide-react";
import { getCurrentPractitioner } from "@/data/practitioners";
import { getAccount } from "@/data/account";
import { Field } from "@/components/portal/Field";
import { PasswordForm } from "@/components/portal/PasswordForm";
import { SettingsCard } from "@/components/portal/SettingsCard";
import { TimeZoneSetting } from "@/components/portal/TimeZoneSetting";
import { TwoStepSignIn } from "@/components/portal/TwoStepSignIn";
import { settingsInputClass } from "@/components/portal/SettingsRow";
import { phoneExample } from "@/lib/countries";
import { PageHeader } from "@/components/ui/PageHeader";
import { resendVerificationAction, updateAccountAction } from "./actions";

export const metadata = { title: "Settings" };

function splitName(fullName: string): { firstName: string; lastName: string } {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [practitioner, account, { saved, error }] = await Promise.all([
    getCurrentPractitioner(),
    getAccount(),
    searchParams,
  ]);
  const { firstName, lastName } = splitName(account.name);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-2 pb-12 sm:px-4">
      <PageHeader
        icon={Settings}
        title="Settings"
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.05] px-2.5 py-1 text-xs font-medium tracking-normal text-muted">
            <Lock className="size-3" aria-hidden />
            Private
          </span>
        }
        description="Your account only. Nothing here appears on your public profile."
      />

      {(saved === "account" || saved === "verification") && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-primary/[0.08] px-4 py-3 text-sm font-medium text-primary"
        >
          <Check className="size-4 shrink-0" aria-hidden />
          {saved === "verification" ? "Verification email sent. Check your inbox." : "Saved. Your public profile is unchanged."}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-alert/[0.08] px-4 py-3 text-sm font-medium text-alert">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsCard icon={<User className="size-[18px]" aria-hidden />} title="Account details">
          <form action={updateAccountAction} className="flex flex-1 flex-col">
            <input type="hidden" name="slug" value={practitioner.slug} />

            <div className="flex-1 space-y-5 px-6 py-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="First name" htmlFor="firstName">
                  <input
                    id="firstName"
                    name="firstName"
                    defaultValue={firstName}
                    required
                    className={settingsInputClass}
                  />
                </Field>
                <Field label="Last name" htmlFor="lastName">
                  <input id="lastName" name="lastName" defaultValue={lastName} className={settingsInputClass} />
                </Field>
              </div>
              <Field label="Email" htmlFor="email">
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={account.email}
                  required
                  className={settingsInputClass}
                />
                {account.pendingEmail ? (
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
                    <span>
                      Waiting for you to confirm <span className="font-medium break-all text-foreground">{account.pendingEmail}</span>. Until
                      then you sign in with this address.
                    </span>
                    <button type="submit" formAction={resendVerificationAction} className="font-medium text-primary hover:underline">
                      Resend confirmation email
                    </button>
                  </p>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
                    <ShieldCheck className="size-3.5" aria-hidden />
                    Verified
                  </p>
                )}
              </Field>
              <Field label="Current password" htmlFor="currentPassword">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  className={settingsInputClass}
                />
                <p className="mt-1.5 text-xs text-muted">Only needed if you change your email.</p>
              </Field>
              <Field label="Phone" htmlFor="phone">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder={phoneExample()}
                  defaultValue={account.phone}
                  className={settingsInputClass}
                />
              </Field>
            </div>

            <div className="flex justify-end border-t border-black/[0.06] px-6 py-4">
              <button
                type="submit"
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Save changes
              </button>
            </div>
          </form>
        </SettingsCard>

        <SettingsCard icon={<KeyRound className="size-[18px]" aria-hidden />} title="Password">
          <PasswordForm />
        </SettingsCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
      <SettingsCard icon={<Globe className="size-[18px]" aria-hidden />} title="Time zone">
        <TimeZoneSetting saved={practitioner.timezone} />
      </SettingsCard>

      <SettingsCard
        icon={<ShieldCheck className="size-[18px]" aria-hidden />}
        title="Two-step sign-in"
        aside={
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              account.twoFactorEnabled ? "bg-primary/[0.1] text-primary" : "bg-black/[0.05] text-muted"
            }`}
          >
            <span className={`size-1.5 rounded-full ${account.twoFactorEnabled ? "bg-primary" : "bg-black/30"}`} aria-hidden />
            {account.twoFactorEnabled ? "On" : "Off"}
          </span>
        }
      >
        <TwoStepSignIn enabled={account.twoFactorEnabled} email={account.email} />
      </SettingsCard>
      </div>
    </div>
  );
}
