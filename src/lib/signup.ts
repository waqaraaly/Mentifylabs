import "server-only";
import { headers } from "next/headers";
import { first, run } from "@/lib/db";
import { MIN_PASSWORD_LENGTH, hashPassword } from "@/lib/password";
import { MAX_PASSWORD_LENGTH } from "@/lib/session";
import { zoneOrDefault } from "@/lib/time";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { CONTACT_DETAIL_LABELS, freePlaceholderSlug } from "@/data/practitioners";
import { sendVerificationEmail } from "@/lib/emailVerification";

const MAX_SIGNUPS_PER_HOUR = 5;

export interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  /** The device's time zone, if it reported one. A missing or invalid value falls back to the platform default. */
  timezone?: string;
}

/**
 * Creates a practitioner (active, draft profile) with its sign-in account. They are not signed in:
 * the account is usable only after the emailed confirmation link is clicked.
 * Professional title is collected later, in /onboarding. Nobody approves the account; the profile only goes
 * public once Super Admin has verified their credentials and they publish it themselves.
 */
export async function signUpPractitioner(input: SignUpInput): Promise<{ ok: true } | { ok: false; message: string }> {
  const fullName = input.fullName.trim();
  const professionalTitle = "Practitioner";
  const email = input.email.trim().toLowerCase();

  if (fullName.length < 2) return { ok: false, message: "Enter your full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  if (input.password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, message: `Choose a password of at most ${MAX_PASSWORD_LENGTH} characters.` };
  }
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

  // No profile link yet: they choose it themselves while setting up, and can't publish until they have.
  const slug = await freePlaceholderSlug();

  // The public contact details start empty. The sign-in email is never copied onto the profile: the practitioner
  // adds an email or phone for clients themselves, if they want one shown.
  const contactMethods = CONTACT_DETAIL_LABELS.map((label) => ({ label, value: "", isPublic: true }));
  const practitioner = await first<{ id: string }>(
    `INSERT INTO practitioners
       (slug, full_name, professional_title, email, session_type, contact_methods,
        status, profile_status, creation_method, fee_currency, timezone)
     VALUES (?, ?, ?, ?, 'both', ?, 'active', 'draft', 'self', ?, ?)
     RETURNING id`,
    slug,
    fullName,
    professionalTitle,
    email,
    JSON.stringify(contactMethods),
    DEFAULT_CURRENCY,
    zoneOrDefault(input.timezone),
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
  // No session yet: they sign in once they have confirmed this address from the email we send now.
  await sendVerificationEmail(user!.id, email, fullName);

  return { ok: true };
}
