import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, homeFor } from "@/lib/session";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Create an account" };

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  const user = await getSessionUser();
  if (user) redirect(homeFor(user.role));

  // The homepage builder passes the name someone tried out on their page, so they don't have to type it again.
  const raw = (await searchParams).name;
  const startingName = (Array.isArray(raw) ? raw[0] : raw)?.replace(/\s+/g, " ").trim().slice(0, 120) ?? "";

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
      <SignUpForm startingName={startingName} />
    </AuthShell>
  );
}
