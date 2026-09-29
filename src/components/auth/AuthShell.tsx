import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarCheck2, LineChart, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { siteConfig } from "@/lib/site";

export const authInputClass =
  "w-full rounded-xl bg-surface py-3 pr-3.5 pl-11 text-[15px] text-foreground ring-1 ring-border outline-none transition placeholder:text-muted/60 focus:ring-2 focus:ring-primary";

export const authButtonClass =
  "group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_-10px_color-mix(in_srgb,var(--primary)_65%,transparent)] transition hover:shadow-[0_14px_30px_-10px_color-mix(in_srgb,var(--primary)_70%,transparent)] hover:opacity-95 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none";

const HIGHLIGHTS = [
  { icon: CalendarCheck2, text: "Manage availability and bookings from one calendar" },
  { icon: LineChart, text: "See requests and sessions at a glance" },
  { icon: ShieldCheck, text: "A verified profile clients can trust" },
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
      <aside className="relative hidden w-[42%] max-w-md shrink-0 flex-col justify-between overflow-hidden bg-sidebar px-10 py-12 text-sidebar-fg lg:flex xl:w-[38%]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-primary/[0.12] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -bottom-32 size-80 rounded-full bg-accent/[0.1] blur-3xl"
        />

        {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no optimization needed */}
        <img src="/brand/mentifylabs-logo.svg" alt={siteConfig.name} className="relative h-9 w-auto" />

        <div className="relative space-y-9">
          <div className="space-y-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-active text-primary ring-1 ring-sidebar-border">
              <Sparkles className="size-[18px]" aria-hidden />
            </span>
            <p className="font-serif text-[28px] leading-[1.3] text-sidebar-strong">
              A calm, modern workspace built for running your therapy practice.
            </p>
          </div>
          <ul className="space-y-4 border-t border-sidebar-border pt-7">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-sidebar-fg">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-active text-primary ring-1 ring-sidebar-border">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-fg/60">
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
