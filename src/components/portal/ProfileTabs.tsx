"use client";

import { useState, type ReactNode } from "react";

type TabId = "profile" | "appearance";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
];

/**
 * The two halves of the public profile page: what it says (Profile) and how it looks (Appearance). Both stay on the
 * page, with the one not shown hidden, so the whole thing is still one form and one Save.
 */
export function ProfileTabs({ profile, appearance }: { profile: ReactNode; appearance: ReactNode }) {
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <div>
      <div role="tablist" aria-label="Public profile" className="flex gap-1 border-b border-black/[0.08]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`profile-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`profile-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px cursor-pointer border-b-2 px-5 py-3 text-sm font-semibold transition ${
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="profile-panel-profile" aria-labelledby="profile-tab-profile" hidden={tab !== "profile"} className="mt-8">
        {profile}
      </div>
      <div role="tabpanel" id="profile-panel-appearance" aria-labelledby="profile-tab-appearance" hidden={tab !== "appearance"} className="mt-2">
        {appearance}
      </div>
    </div>
  );
}
