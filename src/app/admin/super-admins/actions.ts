"use server";

import { createAdminUser, deleteUserPermanently } from "@/data/users";
import { adminInviteAdmin } from "@/lib/passwordReset";
import { revalidateAdminViews } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/session";

import { adminSendAdminLink } from "@/lib/passwordReset";
export async function createAdminUserAction(input: { fullName: string; email: string }) {
  await requireAdmin();
  const result = await createAdminUser(input);
  if (!result.ok) return result;

  const email = input.email.trim().toLowerCase();
  const invite = await adminInviteAdmin(result.userId, email, input.fullName.trim());
  revalidateAdminViews();
  return { ok: true as const, email, ...invite };
}

export async function deleteUserAction(userId: string) {
  const admin = await requireAdmin();
  const result = await deleteUserPermanently(admin.id, userId);
  revalidateAdminViews();
  return result;
}

/** Emails another Super Admin a link to set or choose their password (an invitation if they have never signed in). */
export async function sendAdminLinkAction(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id) return { ok: false as const, message: "Change your own password under Settings." };
  const result = await adminSendAdminLink(userId);
  revalidateAdminViews();
  return result;
}
