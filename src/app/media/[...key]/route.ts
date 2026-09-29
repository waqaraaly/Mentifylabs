import { uploads } from "@/lib/storage";

/** Serves public profile photos from R2. Only keys under photos/ are public; documents never are. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!/^photos\/[a-z0-9-]+\/[a-f0-9]+\.(jpg|png|webp)$/.test(key)) {
    return new Response("Not found", { status: 404 });
  }

  const object = await (await uploads()).get(key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      // Keys are random and never reused, so a photo at a given URL never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ETag: object.httpEtag,
    },
  });
}
