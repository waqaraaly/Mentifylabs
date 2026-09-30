import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { siteConfig } from "@/lib/site";

export const authInputClass =
  "w-full rounded-xl bg-surface py-3 pr-3.5 pl-11 text-[15px] text-foreground ring-1 ring-border outline-none transition placeholder:text-muted/60 focus:ring-2 focus:ring-primary";

export const authButtonClass =
  "group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60";

const NOTES = [
  { stat: "One calendar", text: "Availability, bookings and reschedules stay in sync automatically." },
  { stat: "One inbox", text: "New requests land in one place — confirm or decline in a click." },
  { stat: "One profile", text: "A verified page with your credentials, ready to share." },
];

/** The shared frame for sign-in, sign-up and password pages: a branded panel
 * paired with the form, matching the dashboard's sage-sidebar/light-workspace
 * system. The brand panel hides below `lg`, where the logo takes its place. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen bg-background">
      <aside className="relative hidden w-[42%] max-w-md shrink-0 flex-col justify-between bg-sidebar px-10 py-12 text-sidebar-fg lg:flex xl:w-[38%]">
        {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no optimization needed */}
        <img src="/brand/mentifylabs-logo.svg" alt={siteConfig.name} className="h-9 w-auto" />

        <div className="space-y-8">
          <p className="font-serif text-[26px] leading-[1.35] text-sidebar-strong">
            The practice runs itself between sessions.
          </p>
          <dl className="space-y-5 border-t border-sidebar-border pt-6">
            {NOTES.map(({ stat, text }) => (
              <div key={stat}>
                <dt className="text-sm font-semibold text-sidebar-strong">{stat}</dt>
                <dd className="mt-0.5 text-sm text-sidebar-fg">{text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="text-xs text-sidebar-fg/60">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </aside>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no optimization needed */}
          <img src="/brand/mentifylabs-logo.svg" alt={siteConfig.name} className="mb-8 h-8 w-auto lg:hidden" />

          <h1 className="font-serif text-[28px] leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}

          <div className="mt-8 rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,32,0.04)] ring-1 ring-border sm:p-8">
            {children}
          </div>
          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </main>
  );
}

export function AuthField({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint}
      </div>
      {children}
    </div>
  );
}

/** Wraps an auth `<input>` with a leading icon; pairs with `authInputClass`,
 * which reserves the left padding for it. */
export function AuthInput({
  icon: Icon,
  ...props
}: { icon: LucideIcon } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input {...props} className={authInputClass} />
    </div>
  );
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-alert/[0.08] px-3.5 py-2.5 text-sm font-medium text-alert">
      {message}
    </p>
  );
}
