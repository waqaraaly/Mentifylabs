"use server";

import { redirect } from "next/navigation";
import { signUpPractitioner } from "@/lib/signup";
import { revalidateAdminViews } from "@/lib/revalidate";

export interface SignUpState {
  error?: string;
  values?: { fullName: string; email: string };
}

export async function signUpAction(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const values = {
    fullName: formData.get("fullName")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
  };
  const result = await signUpPractitioner({
    ...values,
    password: formData.get("password")?.toString() ?? "",
    timezone: formData.get("timezone")?.toString(),
  });
  if (!result.ok) return { error: result.message, values };

  revalidateAdminViews();
  redirect(`/signup/check-email?email=${encodeURIComponent(values.email.trim().toLowerCase())}`);
}
