"use server";

import { approveSubmission, createPractitionerManually, getPractitionerBySlug, hideProfile, reactivatePractitioner, rejectVerification, suspendPractitioner, deletePractitionerCompletely } from "@/data/practitioners";
import { renamePractitionerSlug } from "@/data/rename";
import { revalidateAdminViews, revalidatePractitionerViews } from "@/lib/revalidate";
import {
  notifyAccountReactivated,
  notifyAccountSuspended,
  notifyVerificationApproved,
  notifyVerificationRejected,
} from "@/lib/notifications";
import { recordReviewEvent } from "@/data/reviewEvents";
import { requireAdmin } from "@/lib/session";
import { uploads } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import { first } from "@/lib/db";
import { resendVerificationEmail } from "@/lib/emailVerification";
import { adminResetLink } from "@/lib/passwordReset";

/** Admin changes also reach the practitioner's portal and public profile, so refresh both sides. */
function revalidateAdmin(...slugs: string[]) {
  revalidateAdminViews();
  revalidatePractitionerViews(...slugs);
}

import { canDecideSubmission, canReactivate, canSuspend } from "@/lib/practitionerState";
import { DEFAULT_REJECTION_REASON } from "@/lib/verification";
export async function suspendAccount(slug: string) {
  const admin = await requireAdmin();
  const current = await getPractitionerBySlug(slug);
  if (!current || !canSuspend(current)) return;
  await suspendPractitioner(slug);
  await recordReviewEvent(slug, "account_suspended", { actorName: admin.name });
  await notifyAccountSuspended(slug);
  revalidateAdmin(slug);
}

/** `goLive` restores the public profile straight away (verified practitioners only); otherwise it stays offline for them to republish. */
export async function reactivateAccount(slug: string, goLive = false) {
  const admin = await requireAdmin();
  const current = await getPractitionerBySlug(slug);
  if (!current || !canReactivate(current)) return;
  const after = await reactivatePractitioner(slug, goLive);
  await recordReviewEvent(slug, "account_reactivated", { actorName: admin.name });
  await notifyAccountReactivated(slug, after?.profileStatus === "published");
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
  if (!current || !canDecideSubmission(current)) return;
  await approveSubmission(slug);
  await recordReviewEvent(slug, "verification_approved", { actorName: admin.name });
  await notifyVerificationApproved(slug);
  revalidateAdmin(slug);
}

/** Sends a submission back with feedback; the practitioner re-uploads and it returns to the queue. */
export async function rejectSubmissionAction(slug: string, note: string) {
  const admin = await requireAdmin();
  const current = await getPractitionerBySlug(slug);
  if (!current || !canDecideSubmission(current)) return;
  const reason = note.trim() || DEFAULT_REJECTION_REASON;
  await rejectVerification(slug, reason);
  await recordReviewEvent(slug, "verification_rejected", { note: reason, actorName: admin.name });
  await notifyVerificationRejected(slug, reason);
  revalidateAdmin(slug);
}

/** Re-sends the email confirmation link to a practitioner who signed up and has not confirmed yet. */
export async function resendConfirmationEmailAction(slug: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const user = await first<{ id: string }>(
    "SELECT u.id FROM users u JOIN practitioners p ON p.id = u.practitioner_id WHERE p.slug = ?",
    slug,
  );
  if (!user) return { ok: false, message: "This practitioner has no sign-in account yet. Send an invite instead." };
  return resendVerificationEmail(user.id);
}

/**
 * Permanently deletes a practitioner. The admin must type their full name, which is checked again here, so a stray
 * request can't remove anyone. Their stored photo and documents are removed too. Cannot be undone.
 */
export async function deletePractitionerAction(slug: string, typedName: string): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin();
  const current = await getPractitionerBySlug(slug);
  if (!current) return { ok: false, message: "Practitioner not found." };
  if (typedName.trim().toLowerCase() !== current.fullName.trim().toLowerCase()) {
    return { ok: false, message: "The name you typed doesn't match." };
  }
  const result = await deletePractitionerCompletely(slug);
  if (!result.ok) return result;

  try {
    const bucket = await uploads();
    for (const key of result.fileKeys) await bucket.delete(key);
  } catch (error) {
    // The record is already gone; a file that could not be removed is logged so it can be cleaned up.
    console.error(`[delete] Could not remove stored files for ${slug}:`, result.fileKeys, error);
  }
  console.log(`[audit] ${admin.name} deleted practitioner ${slug} (${current.fullName})`);
  revalidateAdmin(slug);
  revalidatePath(`/${slug}`);
  return { ok: true, message: `${current.fullName} was deleted.` };
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
  if (!result.ok) {
    revalidateAdmin();
    return result;
  }
  // The invite goes out straight away, so a practitioner can't be left with no way in. It also creates their
  // sign-in account; "Send reset link" on their page stays available to send it again.
  const invite = await adminResetLink(result.practitioner.slug);
  revalidateAdmin(result.practitioner.slug);
  return { ...result, invite };
}
