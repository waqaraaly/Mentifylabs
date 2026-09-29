import type { Practitioner } from "@/types/practitioner";

export function AboutSection({ practitioner }: { practitioner: Practitioner }) {
  return <p className="text-lg leading-relaxed text-(--pt-text) sm:text-xl">{practitioner.bio}</p>;
}
