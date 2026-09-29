import type { ReactNode } from "react";

/**
 * The classic "label + description on the left, control on the right"
 * settings-page row (Stripe/GitHub-style). Shared by the Profile and
 * Password forms so both read as one consistent, unstyled-by-section list.
 */
export function SettingsRow({
  label,
  htmlFor,
  description,
  children,
}: {
  label: string;
  htmlFor: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 py-6 sm:grid-cols-[220px_1fr] sm:gap-8">
      <div>
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      <div className="min-w-0 self-center">{children}</div>
    </div>
  );
}

export const settingsInputClass =
  "w-full rounded-xl bg-black/[0.025] px-3.5 py-2.5 text-sm outline-none ring-1 ring-transparent focus:bg-surface focus:ring-primary/40 transition";
