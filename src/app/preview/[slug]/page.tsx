import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCurrentPractitioner, getOwnProfilePreview } from "@/data/practitioners";
import { getOpenSlotsByPractitioner } from "@/data/slots";
import { ProfileView } from "@/components/practitioner/ProfileView";
import { parseAppearance } from "@/lib/profileForm";
import { isColorThemeId } from "@/lib/themes";

export const metadata = { title: "Profile preview", robots: { index: false, follow: false } };

type Props = PageProps<"/preview/[slug]">;

/**
 * The practitioner's own view of their profile page, regardless of publish
 * state — a preview URL, never the real one. Only the signed-in owner can
 * open it; booking is disabled (see ProfileView's `preview` flag).
 */
export default async function ProfilePreviewPage({ params, searchParams }: Props) {
  // Live data from D1 on every request, never a copy prerendered at build time.
  await connection();
  const { slug } = await params;
  const query = await searchParams;
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

  // The portal's Appearance section opens this page with the choices it has not saved yet (?template=…&accent=…), so a
  // practitioner can see their own details in a template before committing to it. Nothing here is stored.
  const pick = (name: string) => (typeof query[name] === "string" ? query[name] : undefined);
  const trial = "template" in query ? parseAppearance(pick) : null;

  const theme = pick("colorTheme");
  const shown = trial ? { ...practitioner, template: trial.template, style: trial.style, colorTheme: isColorThemeId(theme) ? theme : practitioner.colorTheme } : practitioner;

  return <ProfileView practitioner={shown} slots={slots} preview embedded={query.embed === "1"} />;
}
