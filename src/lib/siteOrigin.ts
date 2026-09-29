import "server-only";
import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Where emailed links point. Production uses the SITE_URL var from wrangler.jsonc, so a forged
 * Host header can never put someone else's domain into an email. Development uses the request's own address.
 */
export async function siteOrigin(): Promise<string> {
  if (process.env.NODE_ENV === "production") {
    const { env } = await getCloudflareContext({ async: true });
    const configured = (env as unknown as { SITE_URL?: string }).SITE_URL;
    if (configured) return configured.replace(/\/$/, "");
  }
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
