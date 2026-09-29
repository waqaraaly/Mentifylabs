import { Quote } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import { WavyUnderline } from "@/components/ui/WavyUnderline";

// A closing, personal highlight — reuses the same filled "dark card" treatment
// as ReachOutCard (theme-driven via --pt-dark-card*, see globals.css) so it
// reads as a deliberate accent against the page instead of another plain
// section, without introducing a gradient or a one-off color.
export function NoteForClients({ practitioner }: { practitioner: Practitioner }) {
  const note = practitioner.noteForClients?.trim();
  if (!note) return null;

  const firstName = practitioner.fullName.trim().split(/\s+/)[0];

  return (
    <section className="mt-24 sm:mt-32">
      <div className="text-center">
        <h2 className="relative inline-block text-[28px] font-medium text-(--pt-text) sm:text-[38px]">
          A Note for Future Clients
          <WavyUnderline className="absolute inset-x-0 -bottom-3.5 h-3 w-full" />
        </h2>
      </div>

      <div className="relative mx-auto mt-14 max-w-[46rem] overflow-hidden rounded-[28px] border-[1.5px] border-(--pt-dark-card-border) bg-(--pt-dark-card) px-8 py-12 text-center shadow-[0_20px_45px_-20px_var(--pt-dark-card-shadow)] sm:px-16 sm:py-16">
        <Quote
          className="mx-auto size-9 text-(--pt-accent-light) opacity-80 sm:size-10"
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="mx-auto mt-6 max-w-[38ch] font-serif text-xl leading-[1.65] text-(--pt-dark-card-foreground) italic sm:text-2xl">
          {note}
        </p>
        <p className="mt-8 text-sm tracking-[0.08em] text-(--pt-muted-light) uppercase">— {firstName}</p>
      </div>
    </section>
  );
}
