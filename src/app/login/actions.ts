"use server";

import { redirect } from "next/navigation";
import { homeFor, signIn, signOut } from "@/lib/session";
import { beginLoginChallenge } from "@/lib/twoFactor";
import { signInDestination } from "@/lib/signInDestination";

export interface LoginState {
  error?: string;
  email?: string;
  /** The password was right but the address isn't confirmed yet, so the form offers to resend the link. */
  unverified?: boolean;
  /**
   * Where to go next. The form navigates there itself, rather than the action redirecting, so it knows whether the
   * person is signed in yet: the loading animation belongs to the moment they are, not to the wait for a password check.
   */
  redirectTo?: string;
  /** `redirectTo` is the page that asks for the emailed code: signed in is still ahead, so no loader. */
  needsCode?: boolean;
}

export async function signInAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const result = await signIn(email, password);
  if (!result.ok) return { error: result.message, email, unverified: result.unverified };

  const home = homeFor(result.role);
  const destination = signInDestination(formData.get("next")?.toString(), home);

  // A Super Admin with two-step sign-in has no session yet: a code goes to their email and the next page finishes it.
  if (result.twoFactor) {
    const started = await beginLoginChallenge(result.userId);
    if (!started.ok) return { error: started.message, email };
    return { email, redirectTo: `/login/verify?next=${encodeURIComponent(destination)}`, needsCode: true };
  }
  return { email, redirectTo: destination };
}

export async function signOutAction() {
  await signOut();
  redirect("/login");
}
