"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_TIMEZONE } from "@/lib/time";

const PortalTimeZoneContext = createContext<string>(DEFAULT_TIMEZONE);

/** Makes the signed-in practitioner's time zone available to every portal screen, so "today" and "has it started" use their clock. */
export function PortalTimeZoneProvider({ zone, children }: { zone: string; children: ReactNode }) {
  return <PortalTimeZoneContext.Provider value={zone}>{children}</PortalTimeZoneContext.Provider>;
}

/** The practitioner's own time zone, such as "Asia/Karachi". */
export function usePortalTimeZone(): string {
  return useContext(PortalTimeZoneContext);
}
