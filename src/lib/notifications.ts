import "server-only";
import { first } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { renderEmailHtml, renderEmailText, type EmailContent } from "@/lib/emailTemplate";
import { siteOrigin } from "@/lib/siteOrigin";

const HELP = "If you think this is a mistake, reply to this email or contact the MentifyLabs team.";

interface Recipient {
  email: string;
  name: string;
}

/** Account-status emails go to the sign-in address, falling back to the profile's contact email. */
async function practitionerRecipient(slug: string): Promise<Recipient | null> {
  return first<Recipient>(
    `SELECT COALESCE(u.email, p.email) AS email, p.full_name AS name
       FROM practitioners p LEFT JOIN users u ON u.practitioner_id = p.id
      WHERE p.slug = ?`,
    slug,
  );
}

/** Sends one branded email (HTML plus plain-text fallback). Returns whether it was handed to the mail provider. */
export async function sendBrandedEmail(opts: {
  to: string;
  subject: string;
  greeting: string;
  content: EmailContent;
}): Promise<boolean> {
  const { to, subject, greeting, content } = opts;
  return sendEmail({
    to,
    subject,
    text: renderEmailText(content, greeting),
    html: renderEmailHtml(content, greeting),
  });
}

/** A failed email must never undo or block the admin action that triggered it. */
async function deliver(
  to: Recipient | null,
  subject: string,
  content: (origin: string) => EmailContent,
): Promise<void> {
  if (!to?.email) return;
  try {
    await sendBrandedEmail({
      to: to.email,
      subject,
      greeting: `Hi ${to.name},`,
      content: content(await siteOrigin()),
    });
  } catch (error) {
    console.error(`[notify] Could not send "${subject}" to ${to.email}:`, error);
  }
}

export async function notifyAccountApproved(slug: string): Promise<void> {
  await deliver(await practitionerRecipient(slug), "Your MentifyLabs account is approved", (origin) => ({
    eyebrow: "Account",
    heading: "You're approved",
    body: ["Your account has been approved. Sign in to finish setting up your profile and start receiving clients."],
    button: { label: "Sign in", url: `${origin}/login` },
  }));
}

export async function notifyAccountRejected(slug: string, reason: string): Promise<void> {
  await deliver(await practitionerRecipient(slug), "Update on your MentifyLabs application", () => ({
    eyebrow: "Application",
    heading: "We couldn't approve your application",
    body: ["Thank you for applying. After reviewing your application, we weren't able to approve it."],
    note: { label: "Reason from our team", text: reason },
    footnote: HELP,
  }));
}

export async function notifyAccountSuspended(slug: string): Promise<void> {
  await deliver(await practitionerRecipient(slug), "Your MentifyLabs account has been suspended", () => ({
    eyebrow: "Account",
    heading: "Your account has been suspended",
    body: ["You can't sign in right now, and your public profile is hidden until the suspension is lifted."],
    footnote: HELP,
  }));
}

export async function notifyAccountReactivated(slug: string): Promise<void> {
  await deliver(await practitionerRecipient(slug), "Your MentifyLabs account is active again", (origin) => ({
    eyebrow: "Account",
    heading: "Your account is active again",
    body: ["Your account has been reactivated. You can sign in and pick up where you left off."],
    button: { label: "Sign in", url: `${origin}/login` },
  }));
}

export async function notifyVerificationApproved(slug: string): Promise<void> {
  await deliver(await practitionerRecipient(slug), "Your credentials are verified", (origin) => ({
    eyebrow: "Verification",
    heading: "Your credentials are verified",
    body: ["The verified badge now shows on your public profile, and you can publish it and accept bookings."],
    button: { label: "Open your dashboard", url: `${origin}/dashboard` },
  }));
}

export async function notifyVerificationRejected(slug: string, reason: string): Promise<void> {
  await deliver(await practitionerRecipient(slug), "Your verification needs another look", (origin) => ({
    eyebrow: "Verification",
    heading: "We couldn't verify your credentials yet",
    body: ["The document you submitted wasn't approved."],
    note: { label: "Reason from our team", text: reason },
    button: { label: "Submit again", url: `${origin}/dashboard/verification` },
    footnote: "Upload a new document and we'll take another look.",
  }));
}

/** Manage Users disable/enable — covers any role, so it looks the account up by user id. */
export async function notifyUserDisabledChange(userId: string, disabled: boolean): Promise<void> {
  const to = await first<Recipient>("SELECT email, name FROM users WHERE id = ?", userId);
  await deliver(
    to,
    disabled ? "Your MentifyLabs account has been deactivated" : "Your MentifyLabs account is active again",
    (origin) =>
      disabled
        ? {
            eyebrow: "Account",
    heading: "Your account has been deactivated",
            body: ["You can no longer sign in to MentifyLabs with this account."],
            footnote: HELP,
          }
        : {
            eyebrow: "Account",
    heading: "Your account is active again",
            body: ["Your account has been re-enabled. You can sign in again."],
            button: { label: "Sign in", url: `${origin}/login` },
          },
  );
}
