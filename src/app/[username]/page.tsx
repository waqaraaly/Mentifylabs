import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicPractitionerSlugs, getPublicPractitionerBySlug } from "@/data/practitioners";
import { getOpenSlotsByPractitioner } from "@/data/slots";
import { siteConfig } from "@/lib/site";
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
import { WavyUnderline } from "@/components/ui/WavyUnderline";
import { DEFAULT_COLOR_THEME } from "@/lib/themes";

// Pre-render every known practitioner at build time (SSG) so pages are
// served instantly and fully-formed HTML reaches search engine crawlers.
export async function generateStaticParams() {
  const slugs = await getPublicPractitionerSlugs();
  return slugs.map((username) => ({ username }));
}

// Revalidate hourly so profile edits show up without a full redeploy.
export const revalidate = 3600;

type Props = PageProps<"/[username]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const practitioner = await getPublicPractitionerBySlug(username);

  if (!practitioner) {
    return { title: "Practitioner not found" };
  }

  const title = `${practitioner.fullName} — ${practitioner.professionalTitle}`;
  const description = practitioner.bio.slice(0, 155).trim();
  const url = `${siteConfig.url}/${practitioner.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      title,
      description,
      url,
      images: practitioner.photoUrl ? [{ url: practitioner.photoUrl }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: practitioner.photoUrl ? [practitioner.photoUrl] : undefined,
    },
  };
}

export default async function PractitionerProfilePage({ params }: Props) {
  const { username } = await params;
  const practitioner = await getPublicPractitionerBySlug(username);

  if (!practitioner) {
    notFound();
  }

  // Only slots in a format the practitioner currently offers (their session
  // mode is edited in the portal): an online-only profile shouldn't advertise
  // an on-site slot as its next available time.
  const slots = (await getOpenSlotsByPractitioner(practitioner.slug)).filter((s) =>
    practitioner.sessionType === "both"
      ? true
      : practitioner.sessionType === "online"
        ? s.sessionType !== "offline"
        : s.sessionType !== "online",
  );
  const nextSlot =
    [...slots].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0] ?? null;

  return (
    <main
      data-pt-theme={practitioner.colorTheme ?? DEFAULT_COLOR_THEME}
      className="min-h-screen bg-(--pt-outer) p-[7.5px] sm:p-[16.5px]"
    >
      <div className="overflow-hidden rounded-[36px] bg-(--pt-bg) text-(--pt-text)">
        <StructuredData practitioner={practitioner} />

        <BookingModal practitioner={practitioner} slots={slots} />

        <div className="sticky top-0 z-50 border-b border-(--pt-border) bg-(--pt-bg)">
          <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-[7.7px] py-[14px] sm:px-[12.8px] lg:px-[25.6px]">
            <p className="text-2xl tracking-[0.02em] text-(--pt-text)">{siteConfig.name}</p>
            <BookSessionButton />
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

      <StickyBookingBar nextSlot={nextSlot} />
    </main>
  );
}
