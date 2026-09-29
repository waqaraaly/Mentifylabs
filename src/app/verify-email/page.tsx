import Link from "next/link";
import { verifyEmailToken } from "@/lib/emailVerification";
import { AuthShell, authButtonClass } from "@/components/auth/AuthShell";

export const metadata = { title: "Confirm your email", robots: { index: false } };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const result = await verifyEmailToken(value);

  return (
    <AuthShell
      title={result.ok ? "Email confirmed" : "This link has expired"}
      subtitle={result.ok ? "Thanks — your email address is verified." : undefined}
    >
      <div className="space-y-4 text-sm leading-relaxed">
        {!result.ok && (
          <p>
            Verification links work once and expire after a while. You can send yourself a new
            one from Settings once you&apos;re signed in.
          </p>
        )}
        <Link href="/dashboard" className={authButtonClass}>
          Go to your dashboard
        </Link>
      </div>
    </AuthShell>
  );
}
