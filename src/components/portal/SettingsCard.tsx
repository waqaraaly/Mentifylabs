import type { ReactNode } from "react";

/** The icon + title header, then body below, shared by every settings-style card in the portal. */
export function SettingsCard({
  icon,
  title,
  aside,
  children,
}: {
  icon: ReactNode;
  title: string;
  /** Optional content pinned to the right of the header, e.g. a status badge. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl bg-surface ring-1 ring-black/[0.07]">
      <header className="flex items-center gap-3.5 border-b border-black/[0.06] px-4 py-5 sm:px-6">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.1] text-primary">
          {icon}
        </span>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {aside && <div className="ml-auto shrink-0">{aside}</div>}
      </header>
      {children}
    </section>
  );
}
