"use client";

import { useState, type ReactNode } from "react";

export interface ProfileTab {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
}

/**
 * Client-side tab switcher. Every tab's content stays mounted (just hidden
 * via CSS) so the surrounding <form> keeps every field's value regardless
 * of which tab is active — a single "Save changes" submits everything.
 */
export function ProfileTabs({ tabs }: { tabs: ProfileTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto rounded-full bg-black/[0.03] p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
              active === tab.id ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tabs.map((tab) => (
          <div key={tab.id} className={active === tab.id ? "block" : "hidden"}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
