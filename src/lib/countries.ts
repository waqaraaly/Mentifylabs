import { DEFAULT_CURRENCY } from "@/lib/currencies";

export interface Country {
  /** ISO 3166 alpha-2 code. */
  code: string;
  name: string;
  /** The currency most people there would use, so one deployment setting can drive both. */
  currency: string;
  /** A made-up mobile number written the way people there write it, shown as a hint in phone fields. */
  examplePhone: string;
}

/** The countries the app knows how to give a phone-number example for. */
export const COUNTRIES: Country[] = [
  { code: "PK", name: "Pakistan", currency: "PKR", examplePhone: "+92 300 1234567" },
  { code: "US", name: "United States", currency: "USD", examplePhone: "+1 415 555 0132" },
  { code: "GB", name: "United Kingdom", currency: "GBP", examplePhone: "+44 7400 123456" },
  { code: "DE", name: "Germany", currency: "EUR", examplePhone: "+49 1512 3456789" },
  { code: "AE", name: "United Arab Emirates", currency: "AED", examplePhone: "+971 50 123 4567" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", examplePhone: "+966 50 123 4567" },
  { code: "QA", name: "Qatar", currency: "QAR", examplePhone: "+974 3312 3456" },
  { code: "IN", name: "India", currency: "INR", examplePhone: "+91 98765 43210" },
  { code: "BD", name: "Bangladesh", currency: "BDT", examplePhone: "+880 1712 345678" },
  { code: "CA", name: "Canada", currency: "CAD", examplePhone: "+1 604 555 0132" },
  { code: "AU", name: "Australia", currency: "AUD", examplePhone: "+61 412 345 678" },
  { code: "SG", name: "Singapore", currency: "SGD", examplePhone: "+65 8123 4567" },
  { code: "MY", name: "Malaysia", currency: "MYR", examplePhone: "+60 12 345 6789" },
  { code: "TR", name: "Turkey", currency: "TRY", examplePhone: "+90 501 234 56 78" },
];

const byCode = (code: string | undefined) => COUNTRIES.find((c) => c.code === code?.trim().toUpperCase());

/**
 * The deployment's home country, used only to word hints such as the phone-number example. Set
 * NEXT_PUBLIC_DEFAULT_COUNTRY (a code from the list above) to choose it. Left unset, it follows the default
 * currency, so choosing a currency for a deployment already points the hints at the right country.
 */
export const DEFAULT_COUNTRY: Country =
  byCode(process.env.NEXT_PUBLIC_DEFAULT_COUNTRY) ?? COUNTRIES.find((c) => c.currency === DEFAULT_CURRENCY) ?? COUNTRIES[0];

/** "+92 300 1234567" for a Pakistani deployment, "+44 7400 123456" for a British one, and so on. */
export const phoneExample = (): string => DEFAULT_COUNTRY.examplePhone;
