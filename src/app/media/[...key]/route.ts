import { getCloudflareContext } from "@opennextjs/cloudflare";
import { uploads } from "@/lib/storage";

/** Serves public profile photos from R2. Only keys under photos/ are public; documents never are. */
export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!/^photos\/[a-z0-9-]+\/[a-f0-9]+\.(jpg|png|webp)$/.test(key)) {
    return new Response("Not found", { status: 404 });
  }

  // Cloudflare's edge cache answers repeat requests without reading R2 again. It is missing when running locally.
  const edge = typeof caches !== "undefined" ? (caches as unknown as { default?: Cache }).default : undefined;
  const cached = await edge?.match(request.url);
  if (cached) return cached;

  const object = await (await uploads()).get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const response = new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      // Keys are random and never reused, so a photo at a given URL never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ETag: object.httpEtag,
    },
  });
  if (edge) (await getCloudflareContext({ async: true })).ctx.waitUntil(edge.put(request.url, response.clone()));
  return response;
}
