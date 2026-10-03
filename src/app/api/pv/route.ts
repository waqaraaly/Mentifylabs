import { first } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { classifyDevice, classifySource, isBot } from "@/lib/trafficSource";
import { profileExists, recordProfileView } from "@/data/profileStats";

/**
 * Counts a profile visit. Called from the browser after the public profile loads (the page itself is
 * pre-rendered, so the server never sees individual visits). Always answers 204 so it can't be used
 * to probe which profiles exist, and never counts bots or the practitioner's own visits.
 */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });

  // Same-site browser requests only. Browsers always send Origin on a POST, so a request without
  // one is a script and isn't counted.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") ?? "";
  if (!origin) return done;
  try {
    if (new URL(origin).host !== host) return done;
  } catch {
    return done;
  }

  let body: { slug?: unknown; referrer?: unknown; utm?: unknown };
  try {
    body = await request.json();
  } catch {
    return done;
  }
  const slug = typeof body.slug === "string" ? body.slug.toLowerCase().slice(0, 80) : "";
  if (!/^[a-z0-9-]+$/.test(slug)) return done;

  const userAgent = request.headers.get("user-agent");
  if (isBot(userAgent)) return done;

  // Don't count the practitioner looking at their own page, or Super Admin checking it.
  const user = await getSessionUser();
  if (user) {
    if (user.role === "admin") return done;
    const own = await first("SELECT 1 FROM practitioners WHERE id = ? AND slug = ?", user.practitionerId, slug);
    if (own) return done;
  }

  if (!(await profileExists(slug))) return done;

  await recordProfileView({
    slug,
    ip: request.headers.get("cf-connecting-ip") ?? "",
    userAgent: userAgent!,
    source: classifySource(
      typeof body.referrer === "string" ? body.referrer : null,
      typeof body.utm === "string" ? body.utm : null,
      host,
    ),
    country: /^[A-Z]{2}$/.test(request.headers.get("cf-ipcountry") ?? "") ? request.headers.get("cf-ipcountry") : null,
    device: classifyDevice(userAgent!),
  });
  return done;
}
