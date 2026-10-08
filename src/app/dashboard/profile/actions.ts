"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPractitioner, publishOwnProfile, requireOwnSlug, unpublishOwnProfile, updatePractitionerProfile, handleProblem } from "@/data/practitioners";
import { requireRole } from "@/lib/session";
import { MAX_PHOTO_BYTES, PHOTO_TYPES, matchesFileSignature, photoKeyFromUrl, photoUrlFor, randomKeyPart, uploads } from "@/lib/storage";
import { renamePractitionerSlug } from "@/data/rename";
import { revalidateAdminViews } from "@/lib/revalidate";
import { parseProfileForm } from "@/lib/profileForm";

export async function updateProfileAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const me = await getCurrentPractitioner();
  await updatePractitionerProfile(slug, {
    ...parseProfileForm(formData, me.feeRange.currency),
    ...(me.profileSavedAt ? {} : { profileSavedAt: new Date().toISOString() }),
  });

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${slug}`);
  revalidateAdminViews();
}

export interface PublishProfileState {
  error?: string;
}

/** Self-serve publish, gated on verification. Returns an error message instead of throwing so the button can show it inline. */
export async function publishProfileAction(
  _prev: PublishProfileState,
  formData: FormData,
): Promise<PublishProfileState> {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const result = await publishOwnProfile(slug);
  if (!result.ok) return { error: result.message };

  revalidatePath("/dashboard/profile");
  revalidatePath(`/${slug}`);
  revalidateAdminViews();
  return {};
}

/** Takes the practitioner's own profile offline. They can publish again whenever they like. */
export async function unpublishProfileAction(slug: string): Promise<{ error?: string }> {
  const own = await requireOwnSlug(slug);
  const result = await unpublishOwnProfile(own);
  if (!result.ok) return { error: result.message };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${own}`);
  revalidateAdminViews();
  return {};
}

/** Stores a new profile photo in R2 and removes the previous one. Returns an error message on failure. */
export async function uploadProfilePhotoAction(formData: FormData): Promise<{ error?: string }> {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  const extension = PHOTO_TYPES[file.type];
  if (!extension) return { error: "Use a JPG, PNG or WebP image." };
  if (file.size > MAX_PHOTO_BYTES) return { error: "That image is too large. Use one under 2 MB." };

  const bytes = await file.arrayBuffer();
  if (!matchesFileSignature(bytes, file.type)) return { error: "That file isn't a valid image." };

  const { practitionerId } = await requireRole("practitioner");
  const key = `photos/${practitionerId}/${randomKeyPart()}.${extension}`;
  const bucket = await uploads();
  await bucket.put(key, bytes, { httpMetadata: { contentType: file.type } });

  const previous = (await getCurrentPractitioner()).photoUrl;
  await updatePractitionerProfile(slug, { photoUrl: photoUrlFor(key) });
  const previousKey = photoKeyFromUrl(previous);
  if (previousKey) await bucket.delete(previousKey);

  revalidatePhotoViews(slug);
  return {};
}

export async function removeProfilePhotoAction(slug: string) {
  await requireOwnSlug(slug);
  const previousKey = photoKeyFromUrl((await getCurrentPractitioner()).photoUrl);
  await updatePractitionerProfile(slug, { photoUrl: undefined });
  if (previousKey) await (await uploads()).delete(previousKey);
  revalidatePhotoViews(slug);
}

function revalidatePhotoViews(slug: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${slug}`);
  revalidateAdminViews();
}

/** Is this profile link free for the signed-in practitioner? Used for the live "available" hint while they type. */
export async function checkHandleAction(handle: string): Promise<{ ok: boolean; message: string }> {
  const me = await getCurrentPractitioner();
  const result = await handleProblem(handle, me.slug);
  return result.ok ? { ok: true, message: "Available" } : { ok: false, message: result.message };
}

/**
 * Changes the signed-in practitioner's profile link. The current link comes from their session, not from the browser:
 * until they have chosen one they only hold a hidden placeholder link, which the page doesn't know, so there is nothing
 * for the browser to send (and nothing it could be trusted to send).
 */
export async function updateSlugAction(nextSlug: string) {
  const currentSlug = (await getCurrentPractitioner()).slug;
  const result = await renamePractitionerSlug(currentSlug, nextSlug);
  if (result.ok) {
    revalidateAdminViews();
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");
    revalidatePath(`/${currentSlug}`);
    revalidatePath(`/${nextSlug.trim().toLowerCase()}`);
  }
  return result;
}

/** Pauses or resumes new bookings. The public page is cached, so it has to be refreshed for the change to show. */
export async function setAcceptingBookingsAction(accepting: boolean): Promise<{ ok: boolean }> {
  const practitioner = await getCurrentPractitioner();
  await updatePractitionerProfile(practitioner.slug, { acceptingBookings: accepting });
  revalidatePath(`/${practitioner.slug}`);
  revalidatePath("/dashboard", "layout");
  revalidateAdminViews();
  return { ok: true };
}
