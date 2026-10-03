"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { revalidateAdminViews } from "@/lib/revalidate";
import { changeAccountPassword, resendAccountVerificationEmail, updateAccountDetails } from "@/data/account";
import { requireOwnSlug, updatePractitionerProfile } from "@/data/practitioners";

/**
 * Saves the private account only: sign-in email, account name and the phone used
 * for notifications. None of it touches the public profile, which has its own
 * display name and public contact details (Public Profile page), so the public
 * page is deliberately not revalidated here.
 */
export async function updateAccountAction(formData: FormData) {
  const slug = await requireOwnSlug(formData.get("slug")?.toString());
  const firstName = formData.get("firstName")?.toString().trim() || "";
  const lastName = formData.get("lastName")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim() || "";
  const phone = formData.get("phone")?.toString().trim() || "";

  const result = await updateAccountDetails({
    name: [firstName, lastName].filter(Boolean).join(" "),
    email,
    phone,
  });
  if (!result.ok) redirect(`/dashboard/settings?error=${encodeURIComponent(result.message)}`);

  // The practitioner record keeps the account's contact details for Super Admin's own use; these fields are
  // never sent to the public page. The email follows only once the new address is confirmed.
  await updatePractitionerProfile(slug, { phone: phone || undefined });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidateAdminViews();
  redirect("/dashboard/settings?saved=account");
}

export async function resendVerificationAction() {
  const result = await resendAccountVerificationEmail();
  redirect(
    `/dashboard/settings?${result.ok ? "saved=verification" : `error=${encodeURIComponent(result.message)}`}`,
  );
}

export interface PasswordFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function changePasswordAction(
  _prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const currentPassword = formData.get("currentPassword")?.toString() ?? "";
  const newPassword = formData.get("newPassword")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  if (newPassword !== confirmPassword) {
    return { status: "error", message: "New passwords don't match." };
  }

  const result = await changeAccountPassword(currentPassword, newPassword);
  return { status: result.ok ? "success" : "error", message: result.message };
}
