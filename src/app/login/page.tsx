import Link from "next/link";
import { getSessionUser, homeFor } from "@/lib/session";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignedInRedirect } from "@/components/auth/SignedInRedirect";
import { signInDestination } from "@/lib/signInDestination";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  // Signed in (including the moment right after the form succeeds): show the loader, then go to their portal.
  const user = await getSessionUser();
  if (user) return <SignedInRedirect to={signInDestination(next, homeFor(user.role))} />;

  return (
    <AuthShell
      title="Sign in"
      footer={
        <>
          New practitioner?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
