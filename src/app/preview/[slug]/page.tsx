import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCurrentPractitioner, getOwnProfilePreview } from "@/data/practitioners";
import { getOpenSlotsByPractitioner } from "@/data/slots";
import { ProfileView } from "@/components/practitioner/ProfileView";

export const metadata = { title: "Profile preview", robots: { index: false, follow: false } };

type Props = PageProps<"/preview/[slug]">;

/**
 * The practitioner's own view of their profile page, regardless of publish
 * state — a preview URL, never the real one. Only the signed-in owner can
 * open it; booking is disabled (see ProfileView's `preview` flag).
 */
export default async function ProfilePreviewPage({ params }: Props) {
  // Live data from D1 on every request, never a copy prerendered at build time.
  await connection();
  const { slug } = await params;
  const me = await getCurrentPractitioner();
  if (me.slug !== slug) notFound();

  const practitioner = await getOwnProfilePreview(slug);
  if (!practitioner) notFound();

  const slots = (await getOpenSlotsByPractitioner(slug)).filter((s) =>
    practitioner.sessionType === "both"
      ? true
      : practitioner.sessionType === "online"
        ? s.sessionType !== "offline"
        : s.sessionType !== "online",
  );
  const nextSlot =
    [...slots].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))[0] ?? null;

  return <ProfileView practitioner={practitioner} slots={slots} nextSlot={nextSlot} preview />;
}
