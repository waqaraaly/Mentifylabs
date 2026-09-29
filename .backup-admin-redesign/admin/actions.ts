"use server";

import {
  approvePractitioner,
  approveProfile,
  createPractitionerManually,
  hideProfile,
  reactivatePractitioner,
  rejectPractitioner,
  rejectProfile,
  suspendPractitioner,
} from "@/data/practitioners";
import { renamePractitionerSlug } from "@/data/rename";
import { revalidateAdminViews, revalidatePractitionerViews } from "@/lib/revalidate";
import { grantAccess, grantAccessToAll, revokeAccess, revokeAccessFromAll } from "@/data/features";

/** Admin changes also reach the practitioner's portal and public profile, so refresh both sides. */
function revalidateAdmin(...slugs: string[]) {
  revalidateAdminViews();
  revalidatePractitionerViews(...slugs);
}

export async function approveAccount(slug: string) {
  await approvePractitioner(slug);
  revalidateAdmin(slug);
}

export async function rejectAccount(slug: string) {
  await rejectPractitioner(slug, "Application rejected");
  revalidateAdmin(slug);
}

export async function suspendAccount(slug: string) {
  await suspendPractitioner(slug);
  revalidateAdmin(slug);
}

export async function reactivateAccount(slug: string) {
  await reactivatePractitioner(slug);
  revalidateAdmin(slug);
}

export async function approveProfileAction(slug: string) {
  await approveProfile(slug);
  revalidateAdmin(slug);
}

export async function hideProfileAction(slug: string) {
  await hideProfile(slug);
  revalidateAdmin(slug);
}

export async function rejectProfileAction(slug: string, note: string) {
  await rejectProfile(slug, note);
  revalidateAdmin(slug);
}

export async function sendResetLinkAction(slug: string) {
  // TODO: wire to real email delivery once auth exists.
  void slug;
  return { ok: true };
}

export async function updateSlugAction(currentSlug: string, nextSlug: string) {
  const result = await renamePractitionerSlug(currentSlug, nextSlug);
  if (result.ok) revalidateAdmin(currentSlug, nextSlug.trim().toLowerCase());
  return result;
}

export async function createPractitionerAction(input: {
  fullName: string;
  email: string;
  professionalTitle: string;
  skipVerification: boolean;
}) {
  const result = await createPractitionerManually(input);
  if (result.ok) revalidateAdmin(result.practitioner.slug);
  else revalidateAdmin();
  return result;
}

export async function grantFeatureAction(slug: string, featureId: string) {
  await grantAccess(slug, featureId);
  revalidateAdmin(slug);
}

export async function revokeFeatureAction(slug: string, featureId: string) {
  await revokeAccess(slug, featureId);
  revalidateAdmin(slug);
}

export async function enableFeatureForAllAction(featureId: string) {
  await grantAccessToAll(featureId);
  revalidateAdmin();
}

export async function disableFeatureForAllAction(featureId: string) {
  await revokeAccessFromAll(featureId);
  revalidateAdmin();
}
