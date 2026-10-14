import type { Practitioner } from "@/types/practitioner";

export function AboutSection({ practitioner }: { practitioner: Practitioner }) {
  // pre-line keeps the paragraph and line breaks the practitioner typed in the editor.
  return <p className="text-lg leading-relaxed whitespace-pre-line text-(--pt-text) sm:text-xl">{practitioner.bio}</p>;
}
