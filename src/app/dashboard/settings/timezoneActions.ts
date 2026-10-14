"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPractitioner } from "@/data/practitioners";
import { changePractitionerTimezone } from "@/data/timezone";
import { revalidateAdminViews } from "@/lib/revalidate";

export interface TimezoneResult {
  ok: boolean;
  message: string;
}

/**
 * Saves the clock the practitioner works on. Refused while they have upcoming sessions (see `changePractitionerTimezone`).
 * The public page shows their times converted from this zone, so it is refreshed too.
 */
export async function updateTimezoneAction(zone: string): Promise<TimezoneResult> {
  const practitioner = await getCurrentPractitioner();
  const result = await changePractitionerTimezone(practitioner.slug, zone);
  if (!result.ok) return result;

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${practitioner.slug}`);
  revalidateAdminViews();
  return { ok: true, message: "Time zone saved." };
}
