import { revalidatePath } from "next/cache";

/** Refresh every Super Admin view — call after any change a practitioner or client makes that admin reports on. */
export function revalidateAdminViews() {
  revalidatePath("/admin", "layout");
}

/** Refresh the practitioner portal and public profile — call after Super Admin changes a practitioner. */
export function revalidatePractitionerViews(...slugs: string[]) {
  revalidatePath("/dashboard", "layout");
  for (const slug of new Set(slugs)) revalidatePath(`/${slug}`);
}
