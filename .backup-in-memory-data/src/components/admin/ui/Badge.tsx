import type { ReactNode } from "react";
import { STATUS_META } from "./statusMeta";

export function Badge({
  kind,
  children,
  dot = true,
}: {
  kind: string;
  children?: ReactNode;
  dot?: boolean;
}) {
  const meta = STATUS_META[kind] ?? { label: kind, color: "var(--zf-neutral)", bg: "var(--zf-neutral-bg)" };
  return (
    <span className="badge" style={{ color: meta.color, background: meta.bg }}>
      {dot && <span className="badge-dot" />}
      {children ?? meta.label}
    </span>
  );
}
