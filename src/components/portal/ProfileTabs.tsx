"use client";

import { useState, type ReactNode } from "react";
import { ProfileSections, type ProfileSection } from "@/components/portal/ProfileSections";

const APPEARANCE = "appearance";

/**
 * The public profile page as tabs: one for each topic it says something about (Basics, About you, and so on), then
 * Appearance for how it looks. Every panel stays on the page, with the ones not shown hidden, so the whole thing is
 * still one form and one Save.
 */
export function ProfileTabs({ sections, appearance }: { sections: ProfileSection[]; appearance: ReactNode }) {
  const tabs = [...sections.map((s) => ({ id: s.id, label: s.title })), { id: APPEARANCE, label: "Appearance" }];
  const [tab, setTab] = useState<string>(tabs[0].id);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Public profile"
        className="flex gap-1 overflow-x-auto border-b border-black/[0.08] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`profile-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`profile-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px shrink-0 cursor-pointer border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition sm:px-5 ${
              tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sections.map((s) => (
        <div
          key={s.id}
          role="tabpanel"
          id={`profile-panel-${s.id}`}
          aria-labelledby={`profile-tab-${s.id}`}
          hidden={tab !== s.id}
          className="mt-12"
        >
          <ProfileSections sections={[s]} />
        </div>
      ))}
      <div
        role="tabpanel"
        id={`profile-panel-${APPEARANCE}`}
        aria-labelledby={`profile-tab-${APPEARANCE}`}
        hidden={tab !== APPEARANCE}
        className="mt-6"
      >
        {appearance}
      </div>
    </div>
  );
}
