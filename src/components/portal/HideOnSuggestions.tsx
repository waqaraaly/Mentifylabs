"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** The suggestion form opens in its own tab, so it gets the page without the side nav. */
export function HideOnSuggestions({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/dashboard/suggestions") return null;
  return <>{children}</>;
}
