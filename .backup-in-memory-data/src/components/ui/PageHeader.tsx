import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The header every inner portal page shares: an icon tile, the title, one
 * line of context, and the page's main actions on the right, closed off by a
 * hairline so the content below starts on a clean edge.
 */
export function PageHeader({
  icon: Icon,
  title,
  description,
  badge,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-black/[0.07] pt-2 pb-6">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary ring-1 ring-primary/[0.12]">
          <Icon className="size-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
            {badge}
          </h1>
          {description && <p className="mt-1 text-sm leading-relaxed text-muted sm:text-[15px]">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
