import type { ReactNode } from "react";
import { siteConfig } from "@/lib/site";

export { AuthInput, authInputClass } from "./AuthInput";

export const authButtonClass =
  "group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60";

/** The shared frame for sign-in, sign-up and password pages: a full-window
 * photo background with the form in a single centered card on top. */
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
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element -- static local image, no optimization needed */}
      <img src="/brand/auth-bg.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full -scale-x-100 object-cover object-right" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:justify-end lg:pr-[10vw]">
        <div className="w-full max-w-[440px] overflow-hidden rounded-3xl bg-surface shadow-[0_24px_64px_-16px_rgba(16,24,32,0.35)] ring-1 ring-black/[0.06]">
          <div className="px-6 pt-8 pb-8 sm:px-10 sm:pt-10 sm:pb-9">
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, no optimization needed */}
              <img src="/brand/mentifylabs-logo.svg" alt={siteConfig.name} className="h-8 w-auto" />
            </div>

            <div className="mt-8 text-center">
              <h1 className="font-serif text-[28px] leading-tight tracking-tight">{title}</h1>
              {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
            </div>

            <div className="mt-8">{children}</div>
          </div>

          {footer && (
            <div className="border-t border-border bg-background px-6 py-5 text-center text-sm text-muted sm:px-10">
              {footer}
            </div>
          )}
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

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-alert/[0.08] px-3.5 py-2.5 text-sm font-medium text-alert">
      {message}
    </p>
  );
}
