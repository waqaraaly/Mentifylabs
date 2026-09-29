/**
 * Only ever returns an http(s) URL, or undefined. Used to keep practitioner-
 * supplied links (website, socials) from becoming a stored-XSS vector —
 * without this, a value like "javascript:alert(1)" would render straight
 * into an <a href> on the public profile page.
 */
export function safeHttpUrl(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return /^https?:\/\//i.test(withScheme) ? withScheme : undefined;
}
