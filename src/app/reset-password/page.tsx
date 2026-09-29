import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { isResetTokenValid } from "@/lib/passwordReset";
import { AuthShell, authButtonClass } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const valid = await isResetTokenValid(value);

  return (
    <AuthShell
      title={valid ? "Choose a new password" : "This link has expired"}
      subtitle={valid ? "You'll be signed in once it's saved." : undefined}
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {valid ? (
        <ResetPasswordForm token={value} />
      ) : (
        <div className="space-y-4 text-sm leading-relaxed">
          <p>Reset links work once and expire after a while. Ask for a new one and use the latest email.</p>
          <Link href="/forgot-password" className={authButtonClass}>
            Send a new link
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
