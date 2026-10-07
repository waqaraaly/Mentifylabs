"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  completeOnboarding,
  getCurrentPractitioner,
  dismissVerificationPrompt,
  requireOwnSlug,
  submitVerification,
  suggestHandle,
  updatePractitionerProfile,
  updatePractitionerSlug,
} from "@/data/practitioners";
import { recordReviewEvent } from "@/data/reviewEvents";
import { revalidateAdminViews } from "@/lib/revalidate";
import { requireRole } from "@/lib/session";
import { saveCredentialUploads } from "@/lib/credentialUploads";
import { tidyPublicName } from "@/lib/publicName";
import { changePractitionerTimezone } from "@/data/timezone";
import { isValidTimeZone } from "@/lib/time";
import type { SessionType } from "@/types/practitioner";

// The same limit as the profile editor.
const LOCATION_MAX = 160;

/**
 * The wizard's credential step is optional, so nothing ticked, or a file that can't be used, is never an error here.
 * It just means they'll do it later from Verification, same as skipping. When it does go through, it is one submission.
 */
async function submitOnboardingCredentials(slug: string, formData: FormData): Promise<void> {
  const { practitionerId } = await requireRole("practitioner");
  if (!practitionerId) return;
  const result = await saveCredentialUploads(slug, practitionerId, formData);
  if (!result.ok) return;
  if (await submitVerification(slug)) {
    await recordReviewEvent(slug, "verification_submitted", { note: `Submitted: ${result.categories.join(", ")}` });
  }
}

/**
 * Saves what the wizard asks for, submits a credential if one was attached, and ends onboarding. Setup only covers the
 * essentials (name, title, how they see clients, where, time zone, link, credentials); the rest of the profile is done
 * from the checklist on the dashboard. So this saves only the fields it was sent: anything else on the profile, such as
 * details an admin filled in when creating the account, is left exactly as it is.
 */
export async function finishOnboardingAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());

  const professionalTitle = formData.get("professionalTitle")?.toString().trim();
  const fullName = tidyPublicName(formData.get("fullName"));
  const posted = formData.get("sessionType") as SessionType;
  const sessionType = (["online", "offline", "both"] as SessionType[]).includes(posted) ? posted : undefined;
  // A location only means something for sessions in person, so an online-only profile never keeps one (the profile editor does the same).
  const location = sessionType === "online" ? "" : (formData.get("location")?.toString() ?? "").replace(/\s+/g, " ").trim().slice(0, LOCATION_MAX);

  await updatePractitionerProfile(slug, {
    // Required on the practitioner record too, so an empty one leaves the name from sign-up as it is.
    ...(fullName ? { fullName } : {}),
    // Required on the practitioner record, so an empty submission leaves it as-is
    // rather than clearing it back to the signup placeholder.
    ...(professionalTitle ? { professionalTitle } : {}),
    ...(sessionType ? { sessionType } : {}),
    ...(location ? { location } : {}),
  });
  // The clock their slots and sessions run on. An unknown value leaves the one they have; a new account has no sessions to protect.
  const timezone = formData.get("timezone")?.toString();
  if (timezone && isValidTimeZone(timezone)) await changePractitionerTimezone(slug, timezone);
  await submitOnboardingCredentials(slug, formData);
  // The wizard's own credential step covers the first-login nudge, so the ongoing
  // "days left to verify" banner (gated on this flag) can take over from here.
  await dismissVerificationPrompt(slug);
  await completeOnboarding(slug);

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${slug}`);
  revalidateAdminViews();
  redirect("/dashboard");
}

/** Chooses the signed-in practitioner's profile link during setup. Blank is fine: they can choose it later in Settings. */
export async function claimHandleAction(handle: string): Promise<{ ok: true; slug: string } | { ok: false; message: string }> {
  const me = await getCurrentPractitioner();
  const result = await updatePractitionerSlug(me.slug, handle);
  if (!result.ok) return result;
  const slug = handle.trim().toLowerCase();
  revalidateAdminViews();
  return { ok: true, slug };
}

/** A free profile link that fits this name, or "" when none does, so the link step can follow a name they just changed. */
export async function suggestHandleAction(name: string): Promise<string> {
  await getCurrentPractitioner(); // signed-in practitioners only
  return suggestHandle(tidyPublicName(name));
}

/** Ends onboarding without saving any of the wizard's fields. */
export async function skipOnboardingAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  await dismissVerificationPrompt(slug);
  await completeOnboarding(slug);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}
