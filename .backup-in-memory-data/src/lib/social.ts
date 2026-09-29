import type { SocialLink } from "@/types/practitioner";

/**
 * The social platforms a practitioner can add. One list drives the portal's
 * form, the save action and the public page's filter, so a link that can no
 * longer be edited (e.g. an old Twitter/YouTube one) never lingers on the
 * live profile.
 */
export const SOCIAL_PLATFORMS: { platform: SocialLink["platform"]; name: string }[] = [
  { platform: "instagram", name: "Instagram" },
  { platform: "facebook", name: "Facebook" },
  { platform: "linkedin", name: "LinkedIn" },
];

const SUPPORTED = new Set<string>(SOCIAL_PLATFORMS.map((p) => p.platform));

export function isSupportedSocialLink(link: SocialLink): boolean {
  return SUPPORTED.has(link.platform);
}
