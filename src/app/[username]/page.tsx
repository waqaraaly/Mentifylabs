import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicPractitionerSlugs, getPublicPractitionerBySlug, isReservedNotLive } from "@/data/practitioners";
import { getOpenSlotsByPractitioner } from "@/data/slots";
import { notStarted } from "@/lib/viewerTime";
import { siteConfig } from "@/lib/site";
import { ProfileView } from "@/components/practitioner/ProfileView";
import { ProfileNotLive } from "@/components/practitioner/ProfileNotLive";

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
    // A reserved link gets a "not live yet" page. Search engines are kept off it either way.
    return (await isReservedNotLive(username))
      ? { title: "Profile not live yet", robots: { index: false, follow: false } }
      : { title: "Practitioner not found" };
  }

  const title = `${practitioner.fullName}, ${practitioner.professionalTitle}`;
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
    // Claimed but not live yet reads as "not live yet"; anything else is genuinely not found.
    if (await isReservedNotLive(username)) return <ProfileNotLive />;
    notFound();
  }

  // Only slots in a format the practitioner currently offers (their session
  // mode is edited in the portal): an online-only profile shouldn't advertise
  // an on-site slot as its next available time.
  // Slots that have already started are left out, on the practitioner's own clock. This page is saved and reused for up
  // to an hour, so the browser checks again as well; and it converts the times to the visitor's own time zone.
  const slots = notStarted(
    (await getOpenSlotsByPractitioner(practitioner.slug)).filter((s) =>
      practitioner.sessionType === "both"
        ? true
        : practitioner.sessionType === "online"
          ? s.sessionType !== "offline"
          : s.sessionType !== "online",
    ),
    practitioner.timezone,
  );

  return <ProfileView practitioner={practitioner} slots={slots} />;
}
