import Link from "next/link";
import { Eye } from "lucide-react";
import type { Practitioner } from "@/types/practitioner";
import type { Slot } from "@/types/slot";
import { siteConfig } from "@/lib/site";
import { DEFAULT_COLOR_THEME } from "@/lib/themes";
import { ProfileHero } from "@/components/practitioner/ProfileHero";
import { AboutSection } from "@/components/practitioner/AboutSection";
import { ReachOutCard } from "@/components/practitioner/ReachOutCard";
import { AreasOfExpertise } from "@/components/practitioner/AreasOfExpertise";
import { ServicesOffered } from "@/components/practitioner/ServicesOffered";
import { ProfessionalJourney } from "@/components/practitioner/ProfessionalJourney";
import { NoteForClients } from "@/components/practitioner/NoteForClients";
import { ProfileFooter } from "@/components/practitioner/ProfileFooter";
import { StickyBookingBar } from "@/components/practitioner/StickyBookingBar";
import { BookSessionButton } from "@/components/practitioner/BookSessionButton";
import { BookingModal } from "@/components/practitioner/BookingModal";
import { StructuredData } from "@/components/practitioner/StructuredData";
import { ProfileViewTracker } from "@/components/practitioner/ProfileViewTracker";
import { WavyUnderline } from "@/components/ui/WavyUnderline";

/**
 * The public profile's full layout, shared between the live page (/[username])
 * and the practitioner's own preview (/preview/[slug]). `preview` swaps the
 * booking CTAs for a disabled placeholder and adds a top banner — nobody can
 * book a session from a profile that isn't actually published yet.
 */
export function ProfileView({
  practitioner,
  slots,
  nextSlot,
  preview = false,
}: {
  practitioner: Practitioner;
  slots: Slot[];
  nextSlot: Slot | null;
  preview?: boolean;
}) {
  return (
    <main
      data-pt-theme={practitioner.colorTheme ?? DEFAULT_COLOR_THEME}
      className="min-h-screen bg-(--pt-outer) p-[7.5px] sm:p-[16.5px]"
    >
      {preview && (
        <div className="mx-auto mb-[7.5px] flex max-w-[1360px] items-center gap-2.5 rounded-2xl bg-foreground px-5 py-3 text-sm font-medium text-background">
          <Eye className="size-4 shrink-0" aria-hidden />
          This is a preview only — clients can&apos;t find this page or book you here.
          <Link href="/dashboard/profile" className="ml-auto shrink-0 underline underline-offset-2">
            Back to portal
          </Link>
        </div>
      )}

      <div className="overflow-hidden rounded-[36px] bg-(--pt-bg) text-(--pt-text)">
        <StructuredData practitioner={practitioner} />

        {!preview && <ProfileViewTracker slug={practitioner.slug} />}

        {!preview && <BookingModal practitioner={practitioner} slots={slots} />}

        <div className="sticky top-0 z-50 border-b border-(--pt-border) bg-(--pt-bg)">
          <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-[7.7px] py-[14px] sm:px-[12.8px] lg:px-[25.6px]">
            <p className="text-2xl tracking-[0.02em] text-(--pt-text)">{siteConfig.name}</p>
            {preview ? (
              <span
                title="Publish your profile to let clients book you"
                className="shrink-0 rounded-full bg-(--pt-icon-fill) px-6 py-2.5 text-[15px] font-semibold whitespace-nowrap text-(--pt-muted)"
              >
                Book a Session
              </span>
            ) : (
              <BookSessionButton />
            )}
          </div>
        </div>

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
        <div className="mx-auto max-w-[1120px] pt-14 pl-[7.7px] sm:pt-20 sm:pl-[12.8px] lg:pr-0 lg:pl-[25.6px]">
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <section>
              <h2 className="relative inline-block max-w-[18ch] text-[28px] leading-tight font-medium text-(--pt-text) sm:text-[38px]">
                About Me
                <WavyUnderline className="absolute inset-x-0 -bottom-3.5 h-3 w-full" />
              </h2>
              <div className="mt-8 max-w-[68ch] text-lg leading-[1.75] text-(--pt-text)">
                <AboutSection practitioner={practitioner} />
              </div>
            </section>

            <div className="lg:ml-[33px] lg:w-[85%] lg:translate-x-[15%]">
              <ReachOutCard practitioner={practitioner} />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1120px] px-[7.7px] sm:px-[12.8px] lg:px-[25.6px]">
          <AreasOfExpertise practitioner={practitioner} />

          <ServicesOffered practitioner={practitioner} />

          <ProfessionalJourney practitioner={practitioner} />

          <NoteForClients practitioner={practitioner} />

          <div className="h-16 sm:h-24" />
        </div>

        <ProfileFooter />
      </div>

      {!preview && <StickyBookingBar nextSlot={nextSlot} />}
    </main>
  );
}
