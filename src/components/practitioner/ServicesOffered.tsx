import type { Practitioner } from "@/types/practitioner";
import { WavyUnderline } from "@/components/ui/WavyUnderline";

// A plain bullet list: one service per line, with a theme-colored bullet.
export function ServicesOffered({ practitioner }: { practitioner: Practitioner }) {
  if (practitioner.services.length === 0) return null;

  return (
    <section className="mt-24 sm:mt-32">
      <h2 className="relative inline-block text-[28px] font-medium text-(--pt-text) sm:text-[38px]">
        Services offered
        <WavyUnderline className="absolute inset-x-0 -bottom-3.5 h-3 w-full" />
      </h2>

      <ul className="mt-11 list-disc space-y-3.5 pl-6 text-lg leading-snug text-(--pt-text) marker:text-(--pt-accent) sm:text-xl">
        {practitioner.services.map((service) => (
          <li key={service} className="pl-1.5 [overflow-wrap:anywhere]">
            {service}
          </li>
        ))}
      </ul>
    </section>
  );
}
