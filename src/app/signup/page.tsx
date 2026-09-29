import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, homeFor } from "@/lib/session";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Create an account" };

export default async function SignUpPage() {
  const user = await getSessionUser();
  if (user) redirect(homeFor(user.role));

  return (
    <AuthShell
      title="Create your practitioner account"
      subtitle="Set up a profile and a booking link clients can use."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
