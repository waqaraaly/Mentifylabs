import type { ReactNode } from "react";

export interface ProfileSection {
  id: string;
  title: string;
  content: ReactNode;
}

/** The Profile tab: one card per topic, in the order clients read them on the public profile. */
export function ProfileSections({ sections }: { sections: ProfileSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <section key={s.id} id={`section-${s.id}`} className="rounded-2xl bg-surface ring-1 ring-black/[0.07]">
          <header className="border-b border-black/[0.06] px-6 py-5 sm:px-8">
            <h2 className="text-base font-semibold tracking-tight">{s.title}</h2>
          </header>
          <div className="divide-y divide-black/[0.06] px-6 sm:px-8">{s.content}</div>
        </section>
      ))}
    </div>
  );
}
