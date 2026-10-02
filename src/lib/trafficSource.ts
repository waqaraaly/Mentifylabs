/** Pure helpers that turn a raw referrer / user agent into the coarse labels the Stats page shows. */

export type DeviceKind = "mobile" | "tablet" | "desktop";

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|fetch|facebookexternalhit|whatsapp|telegram|discord|slack|curl|wget|python|java|go-http|headless|lighthouse|pingdom|uptime|monitor/i;

/** Crawlers and link-preview fetchers. Most never run JavaScript anyway; this catches the ones that do. */
export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

export function classifyDevice(userAgent: string): DeviceKind {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) return "mobile";
  return "desktop";
}

const SOURCES: Array<[RegExp, string]> = [
  [/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu|yandex)\./i, "Search"],
  [/(^|\.)(instagram)\./i, "Instagram"],
  [/(^|\.)(facebook|fb|l\.facebook|m\.facebook)\./i, "Facebook"],
  [/(^|\.)(linkedin|lnkd)\./i, "LinkedIn"],
  [/(^|\.)(twitter|t\.co|x)\./i, "X / Twitter"],
  [/(^|\.)(wa\.me|whatsapp)\./i, "WhatsApp"],
  [/(^|\.)(youtube|youtu\.be)\./i, "YouTube"],
  [/(^|\.)(tiktok)\./i, "TikTok"],
  [/(^|\.)(t\.me|telegram)\./i, "Telegram"],
];

const UTM_LABELS: Record<string, string> = {
  google: "Search",
  bing: "Search",
  instagram: "Instagram",
  ig: "Instagram",
  facebook: "Facebook",
  fb: "Facebook",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  x: "X / Twitter",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  tiktok: "TikTok",
  telegram: "Telegram",
  email: "Email",
  newsletter: "Email",
};

/**
 * Where a visit came from. An explicit `?utm_source=` on the shared link wins over the referrer,
 * because apps like Instagram often strip the referrer. Anything unrecognised becomes "Other websites".
 */
export function classifySource(referrer: string | null | undefined, utmSource: string | null | undefined, ownHost: string): string {
  const utm = utmSource?.trim().toLowerCase().slice(0, 40);
  if (utm) return UTM_LABELS[utm] ?? "Other";

  if (!referrer) return "Direct";
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "Direct";
  }
  if (host === ownHost.toLowerCase().split(":")[0]) return "MentifyLabs";
  for (const [pattern, label] of SOURCES) if (pattern.test(`${host}.`)) return label;
  return "Other websites";
}
