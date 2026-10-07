"use client";

import { useEffect, useState, type ReactNode } from "react";

export interface ProfileSection {
  id: string;
  label: string;
  title: string;
  icon: ReactNode;
  content: ReactNode;
}

/**
 * One scrolling page instead of hidden tabs: every section is visible in the
 * same order clients see it on the public profile, with a sticky sidebar that
 * jumps between sections.
 */
export function ProfileSections({ sections }: { sections: ProfileSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const elements = sections
      .map((s) => document.getElementById(`section-${s.id}`))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("section-", ""));
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start">
      <nav aria-label="Profile sections" className="min-w-0 lg:sticky lg:top-8">
        <div className="rounded-2xl bg-surface p-4 ring-1 ring-black/[0.07]">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {sections.map((s) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#section-${s.id}`}
                  onClick={() => setActive(s.id)}
                  aria-current={active === s.id ? "true" : undefined}
                  className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm whitespace-nowrap transition ${
                    active === s.id
                      ? "bg-primary/[0.1] font-medium text-primary"
                      : "text-muted hover:bg-black/[0.03] hover:text-foreground"
                  }`}
                >
                  {s.icon}
                  <span className="flex-1">{s.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="space-y-6">
        {sections.map((s) => (
          <section
            key={s.id}
            id={`section-${s.id}`}
            className="scroll-mt-8 rounded-2xl bg-surface ring-1 ring-black/[0.07]"
          >
            <header className="border-b border-black/[0.06] px-6 py-5 sm:px-8">
              <h2 className="text-base font-semibold tracking-tight">{s.title}</h2>
            </header>
            <div className="divide-y divide-black/[0.06] px-6 sm:px-8">{s.content}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
