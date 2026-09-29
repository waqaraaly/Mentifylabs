import type { Practitioner } from "@/types/practitioner";

type FeeRange = Practitioner["feeRange"];

/** True when the practitioner has entered a fee range (min and/or max). */
export function hasFeeRange(range: FeeRange): boolean {
  return range.min > 0 || range.max > 0;
}

// Deterministic thousands separators: toLocaleString can differ between the
// server and the browser and cause a hydration mismatch.
function formatAmount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "PKR 3,000–5,000", or "PKR 3,000" when min and max match or only one is set; null when unset. */
export function formatFeeRange(range: FeeRange): string | null {
  const { currency, min, max } = range;
  if (!hasFeeRange(range)) return null;
  if (!min || !max || min === max) return `${currency} ${formatAmount(min || max)}`;
  return `${currency} ${formatAmount(min)}–${formatAmount(max)}`;
}

/** Just the amounts, no currency: "3,000–5,000", or "3,000" when min and max match or only one is set; null when unset. */
export function formatFeeAmounts(range: FeeRange): string | null {
  const { min, max } = range;
  if (!hasFeeRange(range)) return null;
  if (!min || !max || min === max) return formatAmount(min || max);
  return `${formatAmount(min)}–${formatAmount(max)}`;
}
