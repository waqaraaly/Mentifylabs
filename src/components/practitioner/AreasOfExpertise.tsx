import type { Practitioner } from "@/types/practitioner";
import { WavyUnderline } from "@/components/ui/WavyUnderline";

// Rows three to a row (two on a small screen), each with a bullet point at the start of the name. A theme sets the fill
// (--pt-tile-1), and may also set the text colour (--pt-tile-fg) and an outline (--pt-tile-ring), so it can choose
// between solid and outlined rows. Themes that set neither get white text on a solid row, as before.
export function AreasOfExpertise({ practitioner }: { practitioner: Practitioner }) {
  if (practitioner.specializations.length === 0) return null;

  return (
    <section className="mt-24 sm:mt-32">
      <h2 className="relative inline-block text-[28px] font-medium text-(--pt-text) sm:text-[38px]">
        Areas of expertise
        <WavyUnderline className="absolute inset-x-0 -bottom-3.5 h-3 w-full" />
      </h2>

      <ul className="mt-9 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
        {practitioner.specializations.map((specialization) => (
          <li
            key={specialization}
            className="flex items-center gap-3.5 rounded-[14px] bg-(--pt-tile-1) px-5 py-4 text-[16px] leading-snug font-medium shadow-[inset_0_0_0_1.5px_var(--pt-tile-ring,transparent)] [overflow-wrap:anywhere] text-(--pt-tile-fg,var(--pt-accent-foreground)) transition hover:bg-(--pt-tile-1-hover) sm:text-[17px]"
          >
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-current opacity-75" />
            <span className="min-w-0">{specialization}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
