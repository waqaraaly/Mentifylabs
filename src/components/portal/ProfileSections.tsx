"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check } from "lucide-react";

export interface ProfileSection {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: ReactNode;
  /** Whether the section has the content clients expect to see. */
  done: boolean;
  content: ReactNode;
}

/**
 * One scrolling page instead of hidden tabs: every section is visible in the
 * same order clients see it on the public profile, with a sticky sidebar that
 * jumps between sections and shows which ones are still empty.
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

  const doneCount = sections.filter((s) => s.done).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[230px_1fr] lg:items-start">
      <nav aria-label="Profile sections" className="lg:sticky lg:top-8">
        <div className="rounded-2xl bg-surface p-4 ring-1 ring-black/[0.07]">
          <div className="flex items-baseline justify-between px-2">
            <p className="text-sm font-semibold">Profile strength</p>
            <p className="text-xs text-muted">
              {doneCount}/{sections.length}
            </p>
          </div>
          <div className="mx-2 mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(doneCount / sections.length) * 100}%` }}
            />
          </div>

          <ul className="mt-4 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
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
                  {s.done ? (
                    <Check className="size-3.5 text-primary" aria-label="Complete" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-black/20" aria-label="Needs attention" />
                  )}
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
            <header className="flex items-start gap-3.5 border-b border-black/[0.06] px-6 py-5 sm:px-8">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.1] text-primary">
                {s.icon}
              </span>
              <div>
                <h2 className="text-base font-semibold tracking-tight">{s.title}</h2>
                <p className="mt-0.5 text-sm text-muted">{s.description}</p>
              </div>
            </header>
            <div className="divide-y divide-black/[0.06] px-6 sm:px-8">{s.content}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
