import "server-only";
import { cookies } from "next/headers";
import { first, run } from "@/lib/db";
import { sendBrandedEmail } from "@/lib/notifications";
import { verifyPassword } from "@/lib/password";
import { isLimited, recordHit } from "@/lib/rateLimit";
import { isAccountAllowed, randomToken, sha256Hex, signOutOtherSessions, startSession, type Role, type SessionUser } from "@/lib/session";

/**
 * Two-step sign-in, with a 6-digit code emailed to the account. It works the same for Super Admins and practitioners.
 *
 * A code is good for one use, ten minutes and five wrong guesses. Only a hash is stored. For a sign-in the code is also
 * tied to the browser that asked for it, through a random token in a cookie, so someone who only sees the email can't
 * finish a sign-in started elsewhere. The same codes also confirm turning two-step sign-in on and off.
 */

export const CODE_MINUTES = 10;
export const MAX_WRONG_GUESSES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODES_PER_HOUR = 6;
const MAX_PASSWORD_TRIES = 5;
const CHALLENGE_COOKIE = "ml_2fa";
const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

type Purpose = "login" | "enable" | "disable";
type Fail = { ok: false; message: string; /** The code can't be used any more, so the person has to start again. */ dead?: boolean };

interface CodeRow {
  id: string;
  user_id: string;
  code_hash: string;
  attempts: number;
}

/** Six digits, uniformly random: values past the largest whole multiple of a million are redrawn so no digit is favoured. */
function newCode(): string {
  const limit = 4_294_000_000; // 4,294 × 1,000,000, the largest multiple of a million that fits in 32 bits
  const draw = new Uint32Array(1);
  do crypto.getRandomValues(draw);
  while (draw[0] >= limit);
  return String(draw[0] % 1_000_000).padStart(6, "0");
}

const hashCode = (id: string, code: string) => sha256Hex(`${id}:${code}`);

/** Locally there is no mail provider and the code is written to the server log instead; a deployed Worker must really send it. */
const mailIsOptional = () => process.env.NODE_ENV !== "production";

const SUBJECT: Record<Purpose, string> = {
  login: "Your MentifyLabs sign-in code",
  enable: "Confirm two-step sign-in",
  disable: "Confirm turning off two-step sign-in",
};

async function sendCode(
  user: { id: string; email: string; name: string },
  purpose: Purpose,
  opts: { challengeHash: string | null; cooldown: boolean },
): Promise<{ ok: true } | Fail> {
  const limitKey = `otp:${user.id}`;
  if (await isLimited(limitKey, MAX_CODES_PER_HOUR, 60)) {
    return { ok: false, message: "Too many codes were requested. Try again in an hour." };
  }
  if (opts.cooldown) {
    const recent = await first(
      `SELECT 1 FROM login_codes WHERE user_id = ? AND purpose = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)`,
      user.id,
      purpose,
      `-${RESEND_COOLDOWN_SECONDS} seconds`,
    );
    if (recent) return { ok: false, message: "A code was just sent. Wait a minute before asking for another." };
  }

  // A new code replaces any earlier one for the same purpose, so only the latest email works.
  await run("DELETE FROM login_codes WHERE user_id = ? AND purpose = ?", user.id, purpose);
  const id = crypto.randomUUID();
  const code = newCode();
  await run(
    `INSERT INTO login_codes (id, user_id, purpose, code_hash, challenge_hash, expires_at) VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    user.id,
    purpose,
    await hashCode(id, code),
    opts.challengeHash,
    new Date(Date.now() + CODE_MINUTES * 60 * 1000).toISOString(),
  );
  await recordHit(limitKey);

  const sent = await sendBrandedEmail({
    to: user.email,
    subject: SUBJECT[purpose],
    greeting: `Hi ${user.name},`,
    content: {
      eyebrow: "Security",
      heading: purpose === "login" ? "Your sign-in code" : purpose === "enable" ? "Turn on two-step sign-in" : "Turn off two-step sign-in",
      body: [
        purpose === "login"
          ? "Enter this code to finish signing in to MentifyLabs."
          : purpose === "enable"
            ? "Enter this code in Settings to turn on two-step sign-in. From then on you'll need a code like this every time you sign in."
            : "Enter this code in Settings to turn off two-step sign-in.",
      ],
      note: { label: "Your code", text: code },
      footnote:
        purpose === "login"
          ? `It works once and expires in ${CODE_MINUTES} minutes. If you didn't just try to sign in, someone may know your password: change it now.`
          : `It works once and expires in ${CODE_MINUTES} minutes. If this wasn't you, ignore this email and consider changing your password.`,
    },
  });
  if (!sent && !mailIsOptional()) {
    await run("DELETE FROM login_codes WHERE id = ?", id);
    return { ok: false, message: "We couldn't send the code. Try again in a moment." };
  }
  return { ok: true };
}

/** Checks a code for this user and purpose, using it up if it is right. Wrong guesses are counted and the code dies after five. */
async function checkCode(userId: string, purpose: Purpose, codeInput: string, challengeHash: string | null): Promise<{ ok: true } | Fail> {
  const code = codeInput.replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { ok: false, message: "Enter the 6-digit code from the email." };

  const row = await first<CodeRow>(
    `SELECT id, user_id, code_hash, attempts FROM login_codes
      WHERE user_id = ? AND purpose = ? AND ${challengeHash ? "challenge_hash = ?" : "challenge_hash IS NULL"}
        AND expires_at > ${NOW}`,
    ...(challengeHash ? [userId, purpose, challengeHash] : [userId, purpose]),
  );
  if (!row) return { ok: false, message: "That code has expired. Ask for a new one.", dead: true };

  if ((await hashCode(row.id, code)) !== row.code_hash) {
    await run("UPDATE login_codes SET attempts = attempts + 1 WHERE id = ?", row.id);
    if (row.attempts + 1 >= MAX_WRONG_GUESSES) {
      await run("DELETE FROM login_codes WHERE id = ?", row.id);
      return { ok: false, message: "Too many wrong codes. Ask for a new one.", dead: true };
    }
    return { ok: false, message: "That code isn't right." };
  }

  // Deleting is what uses the code up, so two requests with the same right code can't both succeed.
  const used = await run("DELETE FROM login_codes WHERE id = ? AND attempts < ?", row.id, MAX_WRONG_GUESSES);
  if (used === 0) return { ok: false, message: "That code has expired. Ask for a new one.", dead: true };
  return { ok: true };
}

const userById = (id: string) => first<{ id: string; email: string; name: string }>("SELECT id, email, name FROM users WHERE id = ?", id);

// ---- Signing in ----

/** Emails a code and remembers which browser asked for it. Called once the password has been checked. */
export async function beginLoginChallenge(userId: string): Promise<{ ok: true } | Fail> {
  const user = await userById(userId);
  if (!user) return { ok: false, message: "That account no longer exists." };
  const token = randomToken();
  // No cooldown here: the password was just proven, and signing in again right away is not abuse.
  const result = await sendCode(user, "login", { challengeHash: await sha256Hex(token), cooldown: false });
  if (!result.ok) return result;
  (await cookies()).set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/login",
    maxAge: CODE_MINUTES * 60,
  });
  return { ok: true };
}

async function currentChallenge(): Promise<{ hash: string; userId: string; email: string; name: string } | null> {
  const token = (await cookies()).get(CHALLENGE_COOKIE)?.value;
  if (!token) return null;
  const hash = await sha256Hex(token);
  const row = await first<{ user_id: string; email: string; name: string }>(
    `SELECT c.user_id, u.email, u.name FROM login_codes c JOIN users u ON u.id = c.user_id
      WHERE c.purpose = 'login' AND c.challenge_hash = ? AND c.expires_at > ${NOW}`,
    hash,
  );
  return row ? { hash, userId: row.user_id, email: row.email, name: row.name } : null;
}

/** "a•••@example.com", so the page can say where the code went without showing the whole address. */
export function maskEmail(email: string): string {
  const [local, domain = ""] = email.split("@");
  return `${local.slice(0, 1)}${"•".repeat(Math.max(2, Math.min(6, local.length - 1)))}@${domain}`;
}

/** The sign-in waiting for a code in this browser, for the verification page; null if there isn't one (or it has expired). */
export async function getLoginChallenge(): Promise<{ maskedEmail: string } | null> {
  const challenge = await currentChallenge();
  return challenge ? { maskedEmail: maskEmail(challenge.email) } : null;
}

export async function resendLoginCode(): Promise<{ ok: true } | Fail> {
  const challenge = await currentChallenge();
  if (!challenge) return { ok: false, message: "This sign-in has expired. Start again.", dead: true };
  return sendCode({ id: challenge.userId, email: challenge.email, name: challenge.name }, "login", { challengeHash: challenge.hash, cooldown: true });
}

/** Finishes a sign-in: checks the code, then starts the session. */
export async function completeLoginChallenge(codeInput: string): Promise<{ ok: true; role: Role } | Fail> {
  const challenge = await currentChallenge();
  if (!challenge) return { ok: false, message: "This sign-in has expired. Start again.", dead: true };

  const checked = await checkCode(challenge.userId, "login", codeInput, challenge.hash);
  if (!checked.ok) return checked;

  // The account may have been suspended or removed while the code was in the inbox.
  if (!(await isAccountAllowed(challenge.userId))) return { ok: false, message: "This account can't sign in right now.", dead: true };
  const user = await first<{ role: Role }>("SELECT role FROM users WHERE id = ?", challenge.userId);
  if (!user) return { ok: false, message: "That account no longer exists.", dead: true };

  await startSession(challenge.userId);
  (await cookies()).delete({ name: CHALLENGE_COOKIE, path: "/login" });
  return { ok: true, role: user.role };
}

// ---- Turning it on and off, from Settings ----

export async function requestEnableCode(user: SessionUser): Promise<{ ok: true } | Fail> {
  if (await first("SELECT 1 FROM users WHERE id = ? AND two_factor_enabled_at IS NOT NULL", user.id)) {
    return { ok: false, message: "Two-step sign-in is already on." };
  }
  return sendCode(user, "enable", { challengeHash: null, cooldown: true });
}

/** Turns it on once the emailed code is entered, and signs out every other session so only this one carries on. */
export async function enableTwoFactor(user: SessionUser, code: string): Promise<{ ok: true } | Fail> {
  const checked = await checkCode(user.id, "enable", code, null);
  if (!checked.ok) return checked;
  await run(`UPDATE users SET two_factor_enabled_at = ${NOW} WHERE id = ?`, user.id);
  await signOutOtherSessions(user.id);
  return { ok: true };
}

export async function requestDisableCode(user: SessionUser): Promise<{ ok: true } | Fail> {
  return sendCode(user, "disable", { challengeHash: null, cooldown: true });
}

/** Turning it off needs the password and a fresh emailed code, so a stolen session alone can't remove the protection. */
export async function disableTwoFactor(user: SessionUser, password: string, code: string): Promise<{ ok: true } | Fail> {
  const key = `2fa-off:${user.id}`;
  if (await isLimited(key, MAX_PASSWORD_TRIES, 15)) return { ok: false, message: "Too many attempts. Try again in 15 minutes." };
  const row = await first<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", user.id);
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    await recordHit(key);
    return { ok: false, message: "Your password isn't right." };
  }
  const checked = await checkCode(user.id, "disable", code, null);
  if (!checked.ok) return checked;
  await run("UPDATE users SET two_factor_enabled_at = NULL WHERE id = ?", user.id);
  return { ok: true };
}
