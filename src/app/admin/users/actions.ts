"use server";

import { createAdminUser, deleteUserPermanently, setUserDisabled } from "@/data/users";
import { adminInviteAdmin } from "@/lib/passwordReset";
import { revalidateAdminViews } from "@/lib/revalidate";
import { notifyUserDisabledChange } from "@/lib/notifications";
import { requireAdmin } from "@/lib/session";

export async function createAdminUserAction(input: { fullName: string; email: string }) {
  await requireAdmin();
  const result = await createAdminUser(input);
  if (!result.ok) return result;

  const email = input.email.trim().toLowerCase();
  const invite = await adminInviteAdmin(result.userId, email, input.fullName.trim());
  revalidateAdminViews();
  return { ok: true as const, email, ...invite };
}

export async function disableUserAction(userId: string) {
  const admin = await requireAdmin();
  const result = await setUserDisabled(admin.id, userId, true);
  if (result.ok) await notifyUserDisabledChange(userId, true);
  revalidateAdminViews();
  return result;
}

export async function enableUserAction(userId: string) {
  const admin = await requireAdmin();
  const result = await setUserDisabled(admin.id, userId, false);
  if (result.ok) await notifyUserDisabledChange(userId, false);
  revalidateAdminViews();
  return result;
}

export async function deleteUserAction(userId: string) {
  const admin = await requireAdmin();
  const result = await deleteUserPermanently(admin.id, userId);
  revalidateAdminViews();
  return result;
}
