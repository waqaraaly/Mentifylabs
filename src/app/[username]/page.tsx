import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicPractitionerSlugs, getPublicPractitionerBySlug } from "@/data/practitioners";
import { getOpenSlotsByPractitioner } from "@/data/slots";
import { siteConfig } from "@/lib/site";
import { ProfileView } from "@/components/practitioner/ProfileView";

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

  return <ProfileView practitioner={practitioner} slots={slots} nextSlot={nextSlot} />;
}
