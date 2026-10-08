import { ArrowRight } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import { WavyUnderline } from "@/components/ui/WavyUnderline";

// One service per line, each led by a right-pointing arrow in the theme's accent colour.
export function ServicesOffered({ practitioner }: { practitioner: Practitioner }) {
  if (practitioner.services.length === 0) return null;

  return (
    <section className="mt-24 sm:mt-32">
      <h2 className="relative inline-block text-[28px] font-medium text-(--pt-text) sm:text-[38px]">
        Services offered
        <WavyUnderline className="absolute inset-x-0 -bottom-3.5 h-3 w-full" />
      </h2>

      <ul className="mt-11 space-y-5">
        {practitioner.services.map((service) => (
          <li key={service} className="group flex items-start gap-4 text-xl leading-snug font-medium text-(--pt-text) sm:text-2xl">
            <ArrowRight
              className="mt-[0.2em] size-[1.1em] shrink-0 text-(--pt-accent) transition-transform duration-200 group-hover:translate-x-1"
              strokeWidth={2.25}
              aria-hidden
            />
            <span className="min-w-0 [overflow-wrap:anywhere]">{service}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
