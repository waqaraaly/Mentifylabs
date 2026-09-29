"use server";

import { revalidatePath } from "next/cache";
import { updatePractitionerProfile } from "@/data/practitioners";
import { renamePractitionerSlug } from "@/data/rename";
import { revalidateAdminViews } from "@/lib/revalidate";
import { SOCIAL_PLATFORMS } from "@/lib/social";
import { DEFAULT_COLOR_THEME, isColorThemeId } from "@/lib/themes";
import type { ContactMethod, SessionType, SocialLink } from "@/types/practitioner";

function stringList(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((value) => value.toString().trim())
    .filter(Boolean);
}

export async function updateProfileAction(formData: FormData) {
  const slug = formData.get("slug")?.toString();
  if (!slug) return;

  const socialLinks: SocialLink[] = SOCIAL_PLATFORMS.flatMap(({ platform }) => {
    const url = formData.get(`social_${platform}`)?.toString().trim();
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
    websiteUrl: formData.get("websiteUrl")?.toString().trim() || undefined,
    contactMethods,
    colorTheme,
  });

  revalidatePath("/dashboard/profile");
  revalidatePath(`/${slug}`);
  revalidateAdminViews();
}

export async function updateProfilePhotoAction(slug: string, photoUrl: string | null) {
  await updatePractitionerProfile(slug, { photoUrl: photoUrl ?? undefined });
  revalidatePath("/dashboard/profile");
  revalidatePath(`/${slug}`);
  revalidateAdminViews();
}

export async function updateSlugAction(currentSlug: string, nextSlug: string) {
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
