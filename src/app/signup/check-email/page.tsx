import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResendConfirmation } from "@/components/auth/ResendConfirmation";

export const metadata = { title: "Check your email", robots: { index: false } };

/** Where sign-up ends. The account exists, but it can't be used until the address is confirmed from the email we sent. */
export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string | string[] }> }) {
  const { email } = await searchParams;
  const address = typeof email === "string" ? email.slice(0, 254) : "";

  return (
    <AuthShell
      title="Check your email"
      subtitle="Your account is created. Confirm your email address to sign in and set up your profile."
      footer={
        <>
          Already confirmed?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4 text-sm leading-relaxed text-muted">
        {address ? (
          <ResendConfirmation email={address} />
        ) : (
          <p>We&apos;ve sent you a confirmation link. Open it from your inbox to continue.</p>
        )}
        <p>
          The link works once and expires in 7 days. If it isn&apos;t in your inbox, check your spam folder, or press
          &ldquo;Send it again&rdquo;.
        </p>
      </div>
    </AuthShell>
  );
}
