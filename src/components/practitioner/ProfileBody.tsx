import type { Practitioner } from "@/types/practitioner";
import { ProfileHero } from "@/components/practitioner/ProfileHero";
import { AboutSection } from "@/components/practitioner/AboutSection";
import { bioOf } from "@/lib/profileDisplay";
import { ReachOutCard } from "@/components/practitioner/ReachOutCard";
import { AreasOfExpertise } from "@/components/practitioner/AreasOfExpertise";
import { ServicesOffered } from "@/components/practitioner/ServicesOffered";
import { ProfessionalJourney } from "@/components/practitioner/ProfessionalJourney";
import { WavyUnderline } from "@/components/ui/WavyUnderline";

/**
 * Everything on a public profile between the top bar and the footer: the hero, About me with the contact card, areas of
 * expertise, services and the timeline. The live page and the private preview both draw it with this one component, so
 * they cannot drift apart.
 */
export function ProfileBody({ practitioner }: { practitioner: Practitioner }) {
  return (
    <>
        <ProfileHero practitioner={practitioner} />

        <div className="mx-auto max-w-[1360px] px-[7.7px] sm:px-[12.8px] lg:px-[25.6px]">
          <div className="flex items-center gap-4 pt-10 sm:pt-16">
            <div className="h-px flex-1 bg-(--pt-border)" />
            <span className="flex shrink-0 items-center gap-2">
              <span className="size-[7px] rounded-full bg-(--pt-accent) opacity-40" />
              <span className="size-[7px] rounded-full bg-(--pt-accent)" />
              <span className="size-[7px] rounded-full bg-(--pt-accent) opacity-40" />
            </span>
            <div className="h-px flex-1 bg-(--pt-border)" />
          </div>
        </div>

        {/* This row skips the shared right padding below (lg:pr-0 instead
            of lg:px-[25.6px]) so the Reach Out card has real room to shift
            right without the container's own padding clipping it. */}
        <div className="mx-auto max-w-[1120px] pt-14 pr-[7.7px] pl-[7.7px] sm:pt-20 sm:pr-[12.8px] sm:pl-[12.8px] lg:pr-0 lg:pl-[25.6px]">
          {/* With no bio there is no "About Me", and the Reach out card stands on its own instead of sitting beside an empty column. */}
          <div className={`grid gap-12 ${bioOf(practitioner) ? "lg:grid-cols-[1.4fr_1fr]" : ""}`}>
            {bioOf(practitioner) && (
              <section>
                <h2 className="relative inline-block max-w-[18ch] text-[28px] leading-tight font-medium text-(--pt-text) sm:text-[38px]">
                  About Me
                  <WavyUnderline className="absolute inset-x-0 -bottom-3.5 h-3 w-full" />
                </h2>
                <div className="mt-8 max-w-[68ch] text-lg leading-[1.75] [overflow-wrap:anywhere] text-(--pt-text)">
                  <AboutSection practitioner={practitioner} />
                </div>
              </section>
            )}

            <div className={bioOf(practitioner) ? "lg:ml-[33px] lg:w-[85%] lg:translate-x-[15%]" : "mx-auto w-full max-w-md"}>
              <ReachOutCard practitioner={practitioner} />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1120px] px-[7.7px] sm:px-[12.8px] lg:px-[25.6px]">
          <AreasOfExpertise practitioner={practitioner} />

          <ServicesOffered practitioner={practitioner} />

          <ProfessionalJourney practitioner={practitioner} />

          <div className="h-16 sm:h-24" />
        </div>
    </>
  );
}
