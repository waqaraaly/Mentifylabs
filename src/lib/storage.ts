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

/** Most verification documents one practitioner can keep on file. */
export const MAX_DOCUMENTS_PER_PRACTITIONER = 20;

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);

/** Whether the file's first bytes really are the type the browser claimed, so a renamed file can't slip through. */
export function matchesFileSignature(bytes: ArrayBuffer, type: string): boolean {
  const b = new Uint8Array(bytes.slice(0, 16));
  switch (type) {
    case "application/pdf":
      return startsWith(b, [0x25, 0x50, 0x44, 0x46]); // %PDF
    case "image/jpeg":
      return startsWith(b, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8); // RIFF....WEBP
    default:
      return false;
  }
}
