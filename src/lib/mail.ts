import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface Email {
  to: string;
  subject: string;
  text: string;
  /** Optional branded HTML version; `text` stays as the fallback. */
  html?: string;
}

type MailEnv = { RESEND_API_KEY?: string; MAIL_FROM?: string };

/**
 * Sends through Resend (https://resend.com) when RESEND_API_KEY is set as a Worker secret.
 * Without it, the message is written to the server log instead, so flows still work in development.
 * Returns whether the email was actually handed to Resend.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  const { env } = await getCloudflareContext({ async: true });
  const { RESEND_API_KEY, MAIL_FROM } = env as unknown as MailEnv;

  if (!RESEND_API_KEY) {
    console.info(`[mail] RESEND_API_KEY not set; not sending.\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}`);
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: MAIL_FROM || "MentifyLabs <onboarding@resend.dev>",
      to: [email.to],
      subject: email.subject,
      text: email.text,
      ...(email.html ? { html: email.html } : {}),
    }),
  });
  if (!response.ok) {
    console.error(`[mail] Resend rejected the email to ${email.to}: ${response.status} ${await response.text()}`);
    return false;
  }
  return true;
}
