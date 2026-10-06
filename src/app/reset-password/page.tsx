import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { isResetTokenValid } from "@/lib/passwordReset";
import { AuthShell, authButtonClass } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; invite?: string | string[] }>;
}) {
  const { token, invite: inviteParam } = await searchParams;
  const invite = inviteParam === "1";
  const value = typeof token === "string" ? token : "";
  const valid = await isResetTokenValid(value);

  return (
    <AuthShell
      title={valid ? (invite ? "Accept your invitation" : "Choose a new password") : invite ? "This invitation has expired" : "This link has expired"}
      subtitle={valid ? (invite ? "Create a password to get access to your account." : "You'll be signed in once it's saved.") : undefined}
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {valid ? (
        <ResetPasswordForm token={value} invite={invite} />
      ) : (
        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            {invite
              ? "Invitation links work once and expire after 7 days. Ask the person who invited you to send a new one, or request a link yourself below."
              : "Reset links work once and expire after a while. Ask for a new one and use the latest email."}
          </p>
          <Link href="/forgot-password" className={authButtonClass}>
            Send a new link
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
