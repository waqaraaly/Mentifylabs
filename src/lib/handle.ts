/** A profile link ("handle") is chosen by the practitioner: the part of their public address after the slash. */

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 30;

/** An unclaimed handle held by an account that never verified is given up after this many days. */
export const STALE_HANDLE_DAYS = 60;

const FORMAT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Hidden stand-in slug for someone who has not chosen a link yet. Nobody can pick one on purpose. */
const PLACEHOLDER = /^p-[0-9a-f]{8}$/;

export const isPlaceholderSlug = (slug: string) => PLACEHOLDER.test(slug);

export function makePlaceholderSlug(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return "p-" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Lowercases, and checks the shape only: length, allowed characters, no stray hyphens. Reserved and taken are checked on the server. */
export function validateHandleFormat(raw: string): { ok: true; handle: string } | { ok: false; message: string } {
  const handle = raw.trim().toLowerCase();
  if (handle.length < HANDLE_MIN) return { ok: false, message: `Use at least ${HANDLE_MIN} characters.` };
  if (handle.length > HANDLE_MAX) return { ok: false, message: `Use at most ${HANDLE_MAX} characters.` };
  if (!FORMAT.test(handle)) {
    return { ok: false, message: "Use only lowercase letters, numbers and single hyphens, and don't start or end with a hyphen." };
  }
  if (isPlaceholderSlug(handle)) return { ok: false, message: "Choose a different link." };
  return { ok: true, handle };
}
