import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentPractitioner, suggestHandle } from "@/data/practitioners";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = { title: "Set up your account", robots: { index: false } };

export default async function OnboardingPage() {
  // Live data from D1 on every request, never a copy prerendered at build time.
  await connection();
  const practitioner = await getCurrentPractitioner();
  if (practitioner.onboardedAt) redirect("/dashboard");

  return (
    <OnboardingWizard
      slug={practitioner.slug}
      fullName={practitioner.fullName}
      // "Practitioner" is signup's placeholder default, not a real title — leave the field empty rather than prefill it.
      professionalTitle={practitioner.professionalTitle === "Practitioner" ? "" : practitioner.professionalTitle}
      sessionType={practitioner.sessionType}
      location={practitioner.location ?? ""}
      timezone={practitioner.timezone}
      suggestedHandle={practitioner.slugChosenAt ? practitioner.slug : await suggestHandle(practitioner.fullName)}
      handleChosen={Boolean(practitioner.slugChosenAt)}
    />
  );
}
