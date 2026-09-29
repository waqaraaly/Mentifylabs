import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { first, run } from "@/lib/db";
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from "@/lib/password";

const COOKIE = "ml_session";
const SESSION_DAYS = 30;
const MAX_FAILED_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MINUTES = 15;

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

/** Suspended or rejected practitioners can't sign in or keep using an existing session. */
const ACCOUNT_ALLOWED = `(u.role = 'admin' OR EXISTS (
  SELECT 1 FROM practitioners p WHERE p.id = u.practitioner_id AND p.status NOT IN ('suspended', 'rejected')))`;

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

async function tooManyAttempts(email: string): Promise<boolean> {
  const row = await first<{ n: number }>(
    `SELECT count(*) AS n FROM login_attempts
      WHERE email = ? AND at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
    email,
    `-${ATTEMPT_WINDOW_MINUTES} minutes`,
  );
  return (row?.n ?? 0) >= MAX_FAILED_ATTEMPTS;
}

// Verifying against a throwaway hash when the email is unknown keeps the response time
// the same, so the form can't be used to find out which emails have accounts.
let decoyHash: Promise<string> | undefined;

export type SignInResult = { ok: true; role: Role } | { ok: false; message: string };

export async function signIn(emailInput: string, password: string): Promise<SignInResult> {
  const email = emailInput.trim().toLowerCase();
  if (!email || !password) return { ok: false, message: "Enter your email and password." };
  if (await tooManyAttempts(email)) {
    return { ok: false, message: `Too many attempts. Try again in ${ATTEMPT_WINDOW_MINUTES} minutes.` };
  }

  const row = await first<UserRow>("SELECT * FROM users WHERE email = ?", email);
  decoyHash ??= hashPassword(randomToken());
  const valid = await verifyPassword(password, row?.password_hash ?? (await decoyHash));
  if (!row || !valid) {
    await run("INSERT INTO login_attempts (email) VALUES (?)", email);
    return { ok: false, message: "That email and password don't match." };
  }

  await run("DELETE FROM login_attempts WHERE email = ?", email);
  if (!(await first(`SELECT 1 FROM users u WHERE u.id = ? AND ${ACCOUNT_ALLOWED}`, row.id))) {
    return { ok: false, message: "This account is suspended. Contact the MentifyLabs team for help." };
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
  if (newPassword === currentPassword) {
    return { ok: false, message: "Choose a different password from the current one." };
  }
  await run("UPDATE users SET password_hash = ? WHERE id = ?", await hashPassword(newPassword), user.id);
  const token = (await cookies()).get(COOKIE)?.value;
  await run("DELETE FROM sessions WHERE user_id = ? AND id <> ?", user.id, token ? await sha256Hex(token) : "");
  return { ok: true, message: "Password updated." };
}

/** Updates the signed-in user's own account details (the sign-in email, name and phone). */
export async function updateUserDetails(
  user: SessionUser,
  details: { name: string; email: string; phone: string },
): Promise<{ ok: boolean; message: string }> {
  const email = details.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  const taken = await first("SELECT 1 FROM users WHERE email = ? AND id <> ?", email, user.id);
  if (taken) return { ok: false, message: "Another account already uses that email." };
  // A changed email hasn't been confirmed, so it goes back to unverified — the
  // caller is responsible for sending a fresh verification link.
  const emailChanged = email !== user.email;
  await run(
    `UPDATE users SET name = ?, email = ?, phone = ?${emailChanged ? ", email_verified_at = NULL" : ""} WHERE id = ?`,
    details.name,
    email,
    details.phone,
    user.id,
  );
  return { ok: true, message: "Saved." };
}
