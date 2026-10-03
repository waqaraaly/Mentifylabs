export interface Currency {
  code: string;
  name: string;
}

/** The currencies a practitioner can price their sessions in. One list drives the form, the onboarding step and the server check. */
export const CURRENCIES: Currency[] = [
  { code: "PKR", name: "Pakistani rupee" },
  { code: "USD", name: "US dollar" },
  { code: "GBP", name: "British pound" },
  { code: "EUR", name: "Euro" },
  { code: "AED", name: "UAE dirham" },
  { code: "SAR", name: "Saudi riyal" },
  { code: "QAR", name: "Qatari riyal" },
  { code: "INR", name: "Indian rupee" },
  { code: "BDT", name: "Bangladeshi taka" },
  { code: "CAD", name: "Canadian dollar" },
  { code: "AUD", name: "Australian dollar" },
  { code: "SGD", name: "Singapore dollar" },
  { code: "MYR", name: "Malaysian ringgit" },
  { code: "TRY", name: "Turkish lira" },
];

export const isCurrencyCode = (value: unknown): value is string =>
  typeof value === "string" && CURRENCIES.some((c) => c.code === value);

const configured = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY?.trim().toUpperCase();

/**
 * Only used to pre-select a currency for someone who hasn't chosen one yet, never to overwrite a choice.
 * Set NEXT_PUBLIC_DEFAULT_CURRENCY to change it for a deployment; it falls back to PKR if unset or not in the list.
 */
export const DEFAULT_CURRENCY: string = isCurrencyCode(configured) ? configured : "PKR";

/** The list for a dropdown, with the practitioner's saved currency kept in it even if it predates this list. */
export function currencyOptions(current?: string): { value: string; label: string; detail: string }[] {
  const all = CURRENCIES.map((c) => ({ value: c.code, label: c.code, detail: c.name }));
  if (current && !isCurrencyCode(current)) all.unshift({ value: current, label: current, detail: "Saved currency" });
  return all;
}

/** A submitted currency if it is valid, otherwise the one already on record, otherwise the deployment default. */
export function resolveCurrency(submitted: unknown, existing?: string): string {
  const code = typeof submitted === "string" ? submitted.trim().toUpperCase() : "";
  if (isCurrencyCode(code)) return code;
  return existing || DEFAULT_CURRENCY;
}
