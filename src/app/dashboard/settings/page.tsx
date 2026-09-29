import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Check, FileText, KeyRound, Lock, Settings, ShieldCheck, User } from "lucide-react";
import { getCurrentPractitioner } from "@/data/practitioners";
import { getAccount } from "@/data/account";
import { getDocumentsByPractitioner } from "@/data/documents";
import { DocumentsManager } from "@/components/portal/DocumentsManager";
import { Field } from "@/components/portal/Field";
import { PasswordForm } from "@/components/portal/PasswordForm";
import { settingsInputClass } from "@/components/portal/SettingsRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { resendVerificationAction, updateAccountAction } from "./actions";

export const metadata = { title: "Settings" };

function splitName(fullName: string): { firstName: string; lastName: string } {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

/** A settings card: icon + title header, then the form (body and footer) below. */
function SettingsCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col rounded-2xl bg-surface ring-1 ring-black/[0.07]">
      <header className="flex items-center gap-3.5 border-b border-black/[0.06] px-6 py-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.1] text-primary">
          {icon}
        </span>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </header>
      {children}
    </section>
  );
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
  const documents = await getDocumentsByPractitioner(practitioner.slug);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-1 pb-8 sm:px-3">
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
        actions={
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold ring-1 ring-black/[0.14] transition hover:bg-black/[0.04]"
          >
            Edit public profile
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        }
      />

      {(saved === "account" || saved === "verification") && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl bg-primary/[0.08] px-4 py-3 text-sm font-medium text-primary"
        >
          <Check className="size-4 shrink-0" aria-hidden />
          {saved === "verification" ? "Verification email sent — check your inbox." : "Saved. Your public profile is unchanged."}
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
                {account.emailVerified ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-primary">
                    <ShieldCheck className="size-3.5" aria-hidden />
                    Verified
                  </p>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                    Not verified yet.
                    <button type="submit" formAction={resendVerificationAction} className="font-medium text-primary hover:underline">
                      Resend verification email
                    </button>
                  </p>
                )}
              </Field>
              <Field label="Phone" htmlFor="phone">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+92 300 1234567"
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

      <SettingsCard icon={<FileText className="size-[18px]" aria-hidden />} title="Verification documents">
        <DocumentsManager slug={practitioner.slug} documents={documents} />
      </SettingsCard>
    </div>
  );
}
