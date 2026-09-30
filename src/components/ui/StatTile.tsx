import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Tone = "neutral" | "primary" | "accent" | "alert";

const RULE: Record<Tone, string> = {
  neutral: "bg-black/[0.12]",
  primary: "bg-primary",
  accent: "bg-accent",
  alert: "bg-alert",
};

const ICON: Record<Tone, string> = {
  neutral: "text-muted",
  primary: "text-primary",
  accent: "text-accent-strong",
  alert: "text-alert",
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
      <div className="flex items-center gap-1.5">
        <span className={`h-3 w-0.5 rounded-full ${RULE[tone]}`} aria-hidden />
        <p className="text-xs font-medium tracking-[0.06em] text-muted uppercase">{label}</p>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        {Icon && <Icon className={`size-4 ${ICON[tone]}`} aria-hidden />}
      </div>
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
