import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { first, run } from "@/lib/db";
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from "@/lib/password";
import { clientIp, recordHit } from "@/lib/rateLimit";

const COOKIE = "ml_session";
const SESSION_DAYS = 30;
// Failed sign-ins are counted per email + network address, so a stranger typing wrong passwords for
// someone's email can only lock that address out for themselves, not the real owner. The other two caps
// bound a single address spraying many accounts, and many addresses hammering one account.
const MAX_FAILED_PER_PAIR = 10;
const MAX_FAILED_PER_IP = 30;
const MAX_FAILED_PER_EMAIL = 60;
const ATTEMPT_WINDOW_MINUTES = 15;
export const MAX_PASSWORD_LENGTH = 128;

export type Role = "practitioner" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  practitionerId: string | null;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  practitioner_id: string | null;
  password_hash: string;
  email_verified_at: string | null;
}

const toUser = (r: UserRow): SessionUser => ({
  id: r.id,
  email: r.email,
  name: r.name,
  phone: r.phone,
  role: r.role,
  practitionerId: r.practitioner_id,
});

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Suspended practitioners can't sign in or keep using an existing
 * session, and neither can an account whose email address hasn't been confirmed yet.
 */
const ACCOUNT_ALLOWED = `u.email_verified_at IS NOT NULL AND (u.role = 'admin' OR EXISTS (
  SELECT 1 FROM practitioners p WHERE p.id = u.practitioner_id AND p.status <> 'suspended'))`;

/** The signed-in user for this request, or null. Cached so every component shares one lookup. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = await first<UserRow>(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now') AND ${ACCOUNT_ALLOWED}`,
    await sha256Hex(token),
  );
  return row ? toUser(row) : null;
});

/** Starts a new session for this user and sets the cookie. */
export async function startSession(userId: string): Promise<void> {
  await run("DELETE FROM sessions WHERE expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", await sha256Hex(token), userId, expires.toISOString());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export function homeFor(role: Role): string {
  return role === "admin" ? "/admin" : "/dashboard";
}

/** Redirects to /login unless signed in with this role; a user with the other role goes to their own area. */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}

export const requireAdmin = () => requireRole("admin");

const pairKey = (email: string, ip: string) => `${email}|${ip}`;

async function tooManyAttempts(email: string, ip: string): Promise<boolean> {
  // "email|" up to "email}" ("}" is the character right after "|") is every pair key for this email.
  const row = await first<{ pair: number; ip: number; email: number }>(
    `SELECT sum(email = ?1) AS pair, sum(email = ?2) AS ip, sum(email >= ?3 AND email < ?4) AS email
       FROM login_attempts
      WHERE at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?5)`,
    pairKey(email, ip),
    `ip:${ip}`,
    `${email}|`,
    `${email}}`,
    `-${ATTEMPT_WINDOW_MINUTES} minutes`,
  );
  return (
    (row?.pair ?? 0) >= MAX_FAILED_PER_PAIR ||
    (row?.ip ?? 0) >= MAX_FAILED_PER_IP ||
    (row?.email ?? 0) >= MAX_FAILED_PER_EMAIL
  );
}

// Verifying against a throwaway hash when the email is unknown keeps the response time
// the same, so the form can't be used to find out which emails have accounts.
let decoyHash: Promise<string> | undefined;

/** Why a correctly-authenticated account can't sign in: the only reason left is a suspension. Only called after the password matched. */
function blockedAccountMessage(): string {
  return "This account is suspended. Contact the MentifyLabs team for help.";
}

export type SignInResult = { ok: true; role: Role } | { ok: false; message: string; unverified?: boolean };

export async function signIn(emailInput: string, password: string): Promise<SignInResult> {
  const email = emailInput.trim().toLowerCase();
  if (!email || !password) return { ok: false, message: "Enter your email and password." };
  if (password.length > MAX_PASSWORD_LENGTH) return { ok: false, message: "That email and password don't match." };
  const ip = await clientIp();
  if (await tooManyAttempts(email, ip)) {
    return { ok: false, message: `Too many attempts. Try again in ${ATTEMPT_WINDOW_MINUTES} minutes.` };
  }

  const row = await first<UserRow>("SELECT * FROM users WHERE email = ?", email);
  decoyHash ??= hashPassword(randomToken());
  const valid = await verifyPassword(password, row?.password_hash ?? (await decoyHash));
  if (!row || !valid) {
    await recordHit(pairKey(email, ip));
    await run("INSERT INTO login_attempts (email) VALUES (?)", `ip:${ip}`);
    return { ok: false, message: "That email and password don't match." };
  }

  await run("DELETE FROM login_attempts WHERE email = ?", pairKey(email, ip));
  // The password is right, but the address was never confirmed, so no session until it is.
  if (!row.email_verified_at) {
    return {
      ok: false,
      unverified: true,
      message: "Please confirm your email address first. We sent a confirmation link when you signed up.",
    };
  }
  if (!(await first(`SELECT 1 FROM users u WHERE u.id = ? AND ${ACCOUNT_ALLOWED}`, row.id))) {
    return { ok: false, message: blockedAccountMessage() };
  }
  await startSession(row.id);
  if (row.practitioner_id) {
    await run("UPDATE practitioners SET last_sign_in = ? WHERE id = ?", new Date().toISOString(), row.practitioner_id);
  }
  return { ok: true, role: row.role };
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE id = ?", await sha256Hex(token));
  jar.delete(COOKIE);
}

/** Changes the signed-in user's password after checking the current one, and signs out their other sessions. */
export async function changePassword(
  user: SessionUser,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  const row = await first<UserRow>("SELECT * FROM users WHERE id = ?", user.id);
  if (!row || !(await verifyPassword(currentPassword, row.password_hash))) {
    return { ok: false, message: "Current password is incorrect." };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, message: `New password must be at most ${MAX_PASSWORD_LENGTH} characters.` };
  }
  if (newPassword === currentPassword) {
    return { ok: false, message: "Choose a different password from the current one." };
  }
  await run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(newPassword), user.id);
  const token = (await cookies()).get(COOKIE)?.value;
  await run("DELETE FROM sessions WHERE user_id = ? AND id <> ?", user.id, token ? await sha256Hex(token) : "");
  return { ok: true, message: "Password updated." };
}

/**
 * Updates the signed-in user's own account details. A new email address doesn't replace the sign-in address
 * yet: it waits as `pending_email` until its owner clicks the link sent to it, so a typo can never lock
 * anyone out and nobody can claim an address they don't own. The caller sends that link.
 */
export async function updateUserDetails(
  user: SessionUser,
  details: { name: string; email: string; phone: string },
): Promise<{ ok: boolean; message: string; pendingEmail?: string }> {
  const email = details.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  const taken = await first("SELECT 1 FROM users WHERE email = ? AND id <> ?", email, user.id);
  if (taken) return { ok: false, message: "Another account already uses that email." };

  const emailChanged = email !== user.email;
  await run(
    "UPDATE users SET name = ?, phone = ?, pending_email = ? WHERE id = ?",
    details.name,
    details.phone,
    emailChanged ? email : null,
    user.id,
  );
  return emailChanged
    ? { ok: true, message: `Saved. Confirm ${email} with the link we just sent. Until then you sign in with your current email.`, pendingEmail: email }
    : { ok: true, message: "Saved." };
}
