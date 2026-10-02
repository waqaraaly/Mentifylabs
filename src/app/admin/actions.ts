"use server";

import {
  approvePractitioner,
  approveProfile,
  approveVerification,
  createPractitionerManually,
  hideProfile,
  reactivatePractitioner,
  rejectPractitioner,
  rejectProfile,
  rejectVerification,
  suspendPractitioner,
} from "@/data/practitioners";
import { renamePractitionerSlug } from "@/data/rename";
import { revalidateAdminViews, revalidatePractitionerViews } from "@/lib/revalidate";
import { grantAccess, revokeAccess } from "@/data/features";
import {
  notifyAccountApproved,
  notifyAccountReactivated,
  notifyAccountRejected,
  notifyAccountSuspended,
  notifyVerificationApproved,
  notifyVerificationRejected,
} from "@/lib/notifications";
import { recordReviewEvent } from "@/data/reviewEvents";
import { requireAdmin } from "@/lib/session";
import { adminResetLink } from "@/lib/passwordReset";

/** Admin changes also reach the practitioner's portal and public profile, so refresh both sides. */
function revalidateAdmin(...slugs: string[]) {
  revalidateAdminViews();
  revalidatePractitionerViews(...slugs);
}

export async function approveAccount(slug: string) {
  const admin = await requireAdmin();
  await approvePractitioner(slug);
  await recordReviewEvent(slug, "account_approved", { actorName: admin.name });
  await notifyAccountApproved(slug);
  revalidateAdmin(slug);
}

export async function rejectAccount(slug: string, note: string) {
  const admin = await requireAdmin();
  const reason = note.trim() || "Application rejected";
  await rejectPractitioner(slug, reason);
  await recordReviewEvent(slug, "account_rejected", { note: reason, actorName: admin.name });
  await notifyAccountRejected(slug, reason);
  revalidateAdmin(slug);
}

export async function suspendAccount(slug: string) {
  const admin = await requireAdmin();
  await suspendPractitioner(slug);
  await recordReviewEvent(slug, "account_suspended", { actorName: admin.name });
  await notifyAccountSuspended(slug);
  revalidateAdmin(slug);
}

export async function reactivateAccount(slug: string) {
  const admin = await requireAdmin();
  await reactivatePractitioner(slug);
  await recordReviewEvent(slug, "account_reactivated", { actorName: admin.name });
  await notifyAccountReactivated(slug);
  revalidateAdmin(slug);
}

export async function approveProfileAction(slug: string) {
  await requireAdmin();
  await approveProfile(slug);
  revalidateAdmin(slug);
}

export async function hideProfileAction(slug: string) {
  await requireAdmin();
  await hideProfile(slug);
  revalidateAdmin(slug);
}

export async function rejectProfileAction(slug: string, note: string) {
  await requireAdmin();
  await rejectProfile(slug, note);
  revalidateAdmin(slug);
}

export async function approveVerificationAction(slug: string) {
  const admin = await requireAdmin();
  await approveVerification(slug);
  await recordReviewEvent(slug, "verification_approved", { actorName: admin.name });
  await notifyVerificationApproved(slug);
  revalidateAdmin(slug);
}

export async function rejectVerificationAction(slug: string, note: string) {
  const admin = await requireAdmin();
  await rejectVerification(slug, note);
  await recordReviewEvent(slug, "verification_rejected", { note, actorName: admin.name });
  await notifyVerificationRejected(slug, note);
  revalidateAdmin(slug);
}

/** Creates a one-time link to set a password (also works as an invite for admin-added practitioners). */
export async function sendResetLinkAction(slug: string) {
  await requireAdmin();
  return adminResetLink(slug);
}

export async function updateSlugAction(currentSlug: string, nextSlug: string) {
  await requireAdmin();
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
  await requireAdmin();
  const result = await createPractitionerManually(input);
  if (result.ok) revalidateAdmin(result.practitioner.slug);
  else revalidateAdmin();
  return result;
}

export async function grantFeatureAction(slug: string, featureId: string) {
  await requireAdmin();
  await grantAccess(slug, featureId);
  revalidateAdmin(slug);
}

export async function revokeFeatureAction(slug: string, featureId: string) {
  await requireAdmin();
  await revokeAccess(slug, featureId);
  revalidateAdmin(slug);
}
