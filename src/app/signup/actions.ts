"use server";

import { redirect } from "next/navigation";
import { signUpPractitioner } from "@/lib/signup";
import { revalidateAdminViews } from "@/lib/revalidate";

export interface SignUpState {
  error?: string;
  values?: { fullName: string; professionalTitle: string; email: string };
}

export async function signUpAction(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const values = {
    fullName: formData.get("fullName")?.toString() ?? "",
    professionalTitle: formData.get("professionalTitle")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
  };
  const result = await signUpPractitioner({ ...values, password: formData.get("password")?.toString() ?? "" });
  if (!result.ok) return { error: result.message, values };

  revalidateAdminViews();
  redirect("/dashboard/profile");
}
