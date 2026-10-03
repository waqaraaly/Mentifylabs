"use server";

import {
  approvePractitioner,
  approveSubmission,
  createPractitionerManually,
  getPractitionerBySlug,
  hideProfile,
  reactivatePractitioner,
  rejectPractitioner,
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

/**
 * The one approval: verifies the credentials, activates the account if it was still pending, and tells the
 * practitioner. It does not publish: going live is the practitioner's own step. Only valid while their
 * submission is waiting for a decision.
 */
export async function approveSubmissionAction(slug: string) {
  const admin = await requireAdmin();
  const current = await getPractitionerBySlug(slug);
  if (!current || current.verificationStatus !== "pending") return;
  await approveSubmission(slug);
  await recordReviewEvent(slug, "verification_approved", { actorName: admin.name });
  if (current.status === "pending") await recordReviewEvent(slug, "account_approved", { actorName: admin.name });
  await notifyVerificationApproved(slug);
  revalidateAdmin(slug);
}

/** Sends a submission back with feedback; the practitioner re-uploads and it returns to the queue. */
export async function rejectSubmissionAction(slug: string, note: string) {
  const admin = await requireAdmin();
  const current = await getPractitionerBySlug(slug);
  if (!current || current.verificationStatus !== "pending") return;
  const reason = note.trim() || "Please resubmit your credentials";
  await rejectVerification(slug, reason);
  await recordReviewEvent(slug, "verification_rejected", { note: reason, actorName: admin.name });
  await notifyVerificationRejected(slug, reason);
  revalidateAdmin(slug);
}

export async function hideProfileAction(slug: string) {
  await requireAdmin();
  await hideProfile(slug);
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
