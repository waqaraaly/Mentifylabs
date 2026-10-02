"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPractitioner, publishOwnProfile, requireOwnSlug, updatePractitionerProfile } from "@/data/practitioners";
import { requireRole } from "@/lib/session";
import { MAX_PHOTO_BYTES, PHOTO_TYPES, photoKeyFromUrl, photoUrlFor, randomKeyPart, uploads } from "@/lib/storage";
import { renamePractitionerSlug } from "@/data/rename";
import { revalidateAdminViews } from "@/lib/revalidate";
import { SOCIAL_PLATFORMS } from "@/lib/social";
import { DEFAULT_COLOR_THEME, isColorThemeId } from "@/lib/themes";
import { safeHttpUrl } from "@/lib/url";
import type { ContactMethod, SessionType, SocialLink } from "@/types/practitioner";

function stringList(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((value) => value.toString().trim())
    .filter(Boolean);
}

export async function updateProfileAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());

  const socialLinks: SocialLink[] = SOCIAL_PLATFORMS.flatMap(({ platform }) => {
    const url = safeHttpUrl(formData.get(`social_${platform}`)?.toString());
    return url ? [{ platform, url }] : [];
  });

  const contactLabels = formData.getAll("contactLabel").map((v) => v.toString());
  const contactValues = formData.getAll("contactValue").map((v) => v.toString());
  const contactPublic = formData.getAll("contactPublic").map((v) => v.toString());
  const contactMethods: ContactMethod[] = contactLabels
    .map((label, i) => ({
      label: label.trim(),
      value: (contactValues[i] ?? "").trim(),
      isPublic: contactPublic[i] === "true",
    }))
    // Empty values are kept, so clearing a field doesn't fall back to the account's email/phone.
    .filter((c) => c.label);

  const feeMin = Math.max(0, Number(formData.get("feeMin")) || 0);
  const feeMax = Math.max(0, Number(formData.get("feeMax")) || 0);

  const requestedTheme = formData.get("colorTheme")?.toString();
  const colorTheme = isColorThemeId(requestedTheme) ? requestedTheme : DEFAULT_COLOR_THEME;

  await updatePractitionerProfile(slug, {
    fullName: formData.get("fullName")?.toString().trim() || "",
    professionalTitle: formData.get("professionalTitle")?.toString().trim() || "",
    shortBio: formData.get("shortBio")?.toString().trim() || undefined,
    bio: formData.get("bio")?.toString().trim() || "",
    noteForClients: formData.get("noteForClients")?.toString().trim() || undefined,
    specializations: stringList(formData, "specializations"),
    services: stringList(formData, "services"),
    experienceYears: Number(formData.get("experienceYears")) || 0,
    education: stringList(formData, "education"),
    workExperience: stringList(formData, "workExperience"),
    sessionType: (formData.get("sessionType")?.toString() as SessionType) || "both",
    feeRange: {
      currency: formData.get("feeCurrency")?.toString().trim() || "PKR",
      // Tolerate the two being entered the wrong way round.
      min: Math.min(feeMin, feeMax),
      max: Math.max(feeMin, feeMax),
    },
    location: formData.get("location")?.toString().trim() || undefined,
    socialLinks,
    websiteUrl: safeHttpUrl(formData.get("websiteUrl")?.toString()),
    contactMethods,
    colorTheme,
  });

  revalidatePath("/dashboard/profile");
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

/** Stores a new profile photo in R2 and removes the previous one. Returns an error message on failure. */
export async function uploadProfilePhotoAction(formData: FormData): Promise<{ error?: string }> {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  const extension = PHOTO_TYPES[file.type];
  if (!extension) return { error: "Use a JPG, PNG or WebP image." };
  if (file.size > MAX_PHOTO_BYTES) return { error: "That image is too large. Use one under 2 MB." };

  const { practitionerId } = await requireRole("practitioner");
  const key = `photos/${practitionerId}/${randomKeyPart()}.${extension}`;
  const bucket = await uploads();
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

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

export async function updateSlugAction(currentSlug: string, nextSlug: string) {
  await requireOwnSlug(currentSlug);
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
