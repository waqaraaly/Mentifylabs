import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** The R2 bucket bound as UPLOADS. Photos live under photos/, verification documents under documents/. */
export async function uploads(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  return env.UPLOADS;
}

export const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export const DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export function randomKeyPart(): string {
  return [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Public URL path for a photo key. Photo keys are random, so they can be cached forever. */
export const photoUrlFor = (key: string) => `/media/${key}`;

/** The R2 key behind a /media/... photo URL, or null for anything else (e.g. bundled demo images). */
export function photoKeyFromUrl(url: string | undefined): string | null {
  if (!url?.startsWith("/media/photos/")) return null;
  return url.slice("/media/".length);
}
