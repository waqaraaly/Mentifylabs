"use client";

import { useState } from "react";
import type { SessionType } from "@/types/practitioner";
import { SettingsRow, settingsInputClass } from "@/components/portal/SettingsRow";

/**
 * Session mode + location. Location only makes sense for on-site sessions, so
 * it's rendered (and therefore submitted) only when the mode includes on-site.
 * Saving an online-only profile therefore clears the location, which keeps it
 * off the public page too.
 */
export function SessionModeFields({
  initialMode,
  initialLocation,
}: {
  initialMode: SessionType;
  initialLocation: string;
}) {
  const [mode, setMode] = useState<SessionType>(initialMode);
  // Kept in state so toggling Online -> Both again restores what was typed.
  const [location, setLocation] = useState(initialLocation);
  const hasOnsite = mode === "offline" || mode === "both";

  return (
    <>
      <SettingsRow label="Session mode" htmlFor="sessionType">
        <select
          id="sessionType"
          name="sessionType"
          value={mode}
          onChange={(e) => setMode(e.target.value as SessionType)}
          className={settingsInputClass}
        >
          <option value="online">Online</option>
          <option value="offline">On-Site</option>
          <option value="both">Online &amp; On-Site</option>
        </select>
      </SettingsRow>
      {hasOnsite && (
        <SettingsRow label="Location" htmlFor="location" description="Where you see clients in person.">
          <input
            id="location"
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={settingsInputClass}
          />
        </SettingsRow>
      )}
    </>
  );
}
