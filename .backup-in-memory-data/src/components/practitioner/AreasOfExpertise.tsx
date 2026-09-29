import type { Practitioner } from "@/types/practitioner";
import { WavyUnderline } from "@/components/ui/WavyUnderline";

// Each theme defines 5 tile tints (--pt-tile-1..5) in globals.css — all
// currently set to the same color as the "Book a Session" button
// (--pt-accent). Cycled by index; these must be literal class names (not
// interpolated) for Tailwind to compile them.
const TILE_CLASSES = [
  "bg-(--pt-tile-1) hover:bg-(--pt-tile-1-hover)",
  "bg-(--pt-tile-2) hover:bg-(--pt-tile-2-hover)",
  "bg-(--pt-tile-3) hover:bg-(--pt-tile-3-hover)",
  "bg-(--pt-tile-4) hover:bg-(--pt-tile-4-hover)",
  "bg-(--pt-tile-5) hover:bg-(--pt-tile-5-hover)",
];

export function AreasOfExpertise({ practitioner }: { practitioner: Practitioner }) {
  if (practitioner.specializations.length === 0) return null;

  return (
    <section className="mt-24 sm:mt-32">
      <h2 className="relative inline-block text-[28px] font-medium text-(--pt-text) sm:text-[38px]">
        Areas of expertise
        <WavyUnderline className="absolute inset-x-0 -bottom-3.5 h-3 w-full" />
      </h2>

      {/* A grid of self-contained tiles rather than a chip row or a plain
          list of identical chips. */}
      <div className="mt-9 flex flex-wrap gap-3">
        {practitioner.specializations.map((specialization, i) => (
          <div
            key={specialization}
            className={`group relative overflow-hidden rounded-[10px] border border-transparent px-4 py-[9.6px] sm:px-[19.2px] sm:py-[11.2px] transition-all duration-300 hover:-translate-y-0.5 hover:border-(--pt-tile-border) hover:shadow-[0_14px_26px_-14px_rgba(32,34,31,0.22)] ${TILE_CLASSES[i % TILE_CLASSES.length]}`}
          >
            <p
              className="relative text-[14.4px] leading-snug text-(--pt-accent-foreground) [font-weight:var(--pt-tile-text-weight)] sm:text-base"
            >
              {specialization}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
