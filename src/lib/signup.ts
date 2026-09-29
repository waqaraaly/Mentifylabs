import "server-only";
import { headers } from "next/headers";
import { first, run } from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import { MIN_PASSWORD_LENGTH, hashPassword } from "@/lib/password";
import { startSession } from "@/lib/session";
import { CONTACT_DETAIL_LABELS, uniqueSlugFor } from "@/data/practitioners";
import { getAdminSettings } from "@/data/adminSettings";
import { sendVerificationEmail } from "@/lib/emailVerification";

const MAX_SIGNUPS_PER_HOUR = 5;

export interface SignUpInput {
  fullName: string;
  professionalTitle: string;
  email: string;
  password: string;
}

/**
 * Creates a practitioner (pending approval, draft profile) with its sign-in account and signs them in.
 * Super Admin still approves the account and publishes the profile before it goes public.
 */
export async function signUpPractitioner(input: SignUpInput): Promise<{ ok: true } | { ok: false; message: string }> {
  const fullName = input.fullName.trim();
  const professionalTitle = input.professionalTitle.trim() || "Practitioner";
  const email = input.email.trim().toLowerCase();

  if (fullName.length < 2) return { ok: false, message: "Enter your full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  // Throttle by network address, reusing the failed-login table.
  const ip = (await headers()).get("cf-connecting-ip") ?? "local";
  const throttleKey = `signup:${ip}`;
  const recent = await first<{ n: number }>(
    "SELECT count(*) AS n FROM login_attempts WHERE email = ? AND at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour')",
    throttleKey,
  );
  if ((recent?.n ?? 0) >= MAX_SIGNUPS_PER_HOUR) {
    return { ok: false, message: "Too many sign-ups from this network. Try again in an hour." };
  }

  if (await first("SELECT 1 FROM users WHERE email = ?", email)) {
    return { ok: false, message: "An account with this email already exists. Sign in, or reset your password." };
  }

  const slug = await uniqueSlugFor(fullName);
  if (!slug) return { ok: false, message: "Enter your name using letters." };

  const contactMethods = CONTACT_DETAIL_LABELS.map((label) => ({
    label,
    value: label === "Email" ? email : "",
    isPublic: true,
  }));
  const practitioner = await first<{ id: string }>(
    `INSERT INTO practitioners
       (slug, full_name, professional_title, email, session_type, contact_methods,
        status, profile_status, creation_method)
     VALUES (?, ?, ?, ?, 'both', ?, 'pending', 'draft', 'self')
     RETURNING id`,
    slug,
    fullName,
    professionalTitle,
    email,
    JSON.stringify(contactMethods),
  );

  let user: { id: string } | null;
  try {
    user = await first<{ id: string }>(
      `INSERT INTO users (email, name, password_hash, role, practitioner_id)
       VALUES (?, ?, ?, 'practitioner', ?) RETURNING id`,
      email,
      fullName,
      await hashPassword(input.password),
      practitioner!.id,
    );
  } catch (error) {
    await run("DELETE FROM practitioners WHERE id = ?", practitioner!.id);
    throw error;
  }

  await run("INSERT INTO login_attempts (email) VALUES (?)", throttleKey);
  await startSession(user!.id);
  await sendVerificationEmail(user!.id, email, fullName);

  const settings = await getAdminSettings();
  if (settings.notifyNewSignup) {
    await sendEmail({
      to: settings.email,
      subject: `New practitioner sign-up: ${fullName}`,
      text: `${fullName} (${professionalTitle}, ${email}) just signed up and is waiting for approval in Super Admin > Pending approval.`,
    });
  }
  return { ok: true };
}
