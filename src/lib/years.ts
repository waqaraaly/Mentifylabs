/**
 * The years on a timeline entry ("Title, Place, 2018–2024"). People enter plain years; the public profile shows the
 * current year as "Present", so an ongoing role never needs the word typed and never goes out of date by itself.
 */

const CURRENT_YEAR = () => new Date().getFullYear();

/** Words people used to type for "still going", from before the field took only years. */
const ONGOING = /^(present|current|now|ongoing|today)$/i;

/** Digits only, at most four: all a year field accepts. */
export const yearDigits = (value: string): string => value.replace(/\D/g, "").slice(0, 4);

/** An older "Present" becomes the current year; anything else is cut down to a year, or nothing. */
export function toYear(value: string, now = CURRENT_YEAR()): string {
  const v = value.trim();
  if (ONGOING.test(v)) return String(now);
  const year = v.match(/\d{4}/)?.[0];
  return year ?? "";
}

/** "Title, Place, 2018-Present" with its years made plain: "Title, Place, 2018–2026". Entries without years are kept. */
export function cleanEntryYears(raw: string, now = CURRENT_YEAR()): string {
  const parts = raw.split(",").map((p) => p.trim());
  const last = parts[parts.length - 1] ?? "";
  if (parts.length < 2 || !(/\d/.test(last) || /present|current|now|ongoing|today/i.test(last))) return raw;
  const [from = "", to = ""] = last.split(/\s*[–—-]\s*/);
  const f = toYear(from, now);
  const t = toYear(to, now);
  const years = f && t ? `${f}–${t}` : f || t;
  return [...parts.slice(0, -1), years].filter(Boolean).join(", ");
}

/** What a visitor reads: a range that ends in the current year ends in "Present". */
export function displayYears(years: string, now = CURRENT_YEAR()): string {
  const range = years.match(/^(\d{4})\s*[–—-]\s*(\d{4})$/);
  if (range && Number(range[2]) >= now) return `${range[1]}–Present`;
  return years;
}
