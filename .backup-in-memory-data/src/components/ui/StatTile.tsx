import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Tone = "neutral" | "primary" | "accent" | "alert";

const CHIP: Record<Tone, string> = {
  neutral: "bg-black/[0.05] text-muted",
  primary: "bg-primary/[0.1] text-primary",
  accent: "bg-accent/25 text-accent-strong",
  alert: "bg-alert/[0.1] text-alert",
};

const DETAIL: Record<Tone, string> = {
  neutral: "text-muted",
  primary: "text-muted",
  accent: "text-accent-strong",
  alert: "text-alert",
};

export function StatTile({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
  href,
  visual,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: LucideIcon;
  tone?: Tone;
  href?: string;
  visual?: ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-[0.06em] text-muted uppercase">{label}</p>
        {Icon && (
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${CHIP[tone]}`}>
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {detail && <p className={`mt-1 text-sm ${DETAIL[tone]}`}>{detail}</p>}
      {visual && <div className="mt-4">{visual}</div>}
    </>
  );

  const base = "block rounded-2xl bg-surface p-5 ring-1 ring-black/[0.07]";
  return href ? (
    <Link href={href} className={`${base} transition hover:ring-black/[0.16]`}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}
