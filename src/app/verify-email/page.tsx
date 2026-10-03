import Link from "next/link";
import { isVerificationTokenValid } from "@/lib/emailVerification";
import { AuthShell, authButtonClass } from "@/components/auth/AuthShell";
import { ConfirmEmailForm } from "./ConfirmEmailForm";

export const metadata = { title: "Confirm your email", robots: { index: false } };

/**
 * Opening the link only checks it. The address is confirmed (and the person signed in) when they press the button,
 * so a mail scanner or link preview that merely fetches this page can never use up their one-time link.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const valid = await isVerificationTokenValid(value);

  if (!valid) {
    return (
      <AuthShell title="This link has expired" subtitle="Confirmation links work once and expire after a while.">
        <div className="space-y-4 text-sm leading-relaxed">
          <p>Sign in with your email and password and we&apos;ll offer to send you a new one.</p>
          <Link href="/login" className={authButtonClass}>
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Confirm your email" subtitle="One more step. Confirm this address and we'll sign you in.">
      <ConfirmEmailForm token={value} />
    </AuthShell>
  );
}
