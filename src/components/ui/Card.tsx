import type { ReactNode } from "react";

export function Card({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-black/[0.04]">
      {title && (
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
