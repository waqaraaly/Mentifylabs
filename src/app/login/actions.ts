"use server";

import { redirect } from "next/navigation";
import { homeFor, signIn, signOut } from "@/lib/session";

export interface LoginState {
  error?: string;
  email?: string;
}

/** Only same-site paths, so the ?next= link can't send someone to another website after signing in. */
function safeNext(value: FormDataEntryValue | null): string | null {
  const next = value?.toString() ?? "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : null;
}

export async function signInAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const result = await signIn(email, password);
  if (!result.ok) return { error: result.message, email };

  const home = homeFor(result.role);
  const next = safeNext(formData.get("next"));
  redirect(next && next.startsWith(home) ? next : home);
}

export async function signOutAction() {
  await signOut();
  redirect("/login");
}
