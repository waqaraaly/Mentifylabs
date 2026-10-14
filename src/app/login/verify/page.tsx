import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, homeFor } from "@/lib/session";
import { getLoginChallenge } from "@/lib/twoFactor";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignedInRedirect } from "@/components/auth/SignedInRedirect";
import { signInDestination } from "@/lib/signInDestination";
import { VerifyCodeForm } from "./VerifyCodeForm";

export const metadata = { title: "Enter your code", robots: { index: false } };

export default async function VerifyCodePage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  // A correct code signs them in, and the page re-renders signed in: show the loader, then go to their portal.
  const user = await getSessionUser();
  if (user) return <SignedInRedirect to={signInDestination(next, homeFor(user.role))} />;

  // Nothing waiting for a code in this browser (or it expired): back to the start.
  const challenge = await getLoginChallenge();
  if (!challenge) redirect("/login");

  return (
    <AuthShell
      title="Check your email"
      subtitle={`We sent a 6-digit code to ${challenge.maskedEmail}. Enter it to finish signing in.`}
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <VerifyCodeForm next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
