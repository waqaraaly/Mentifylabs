import { afterEach, describe, expect, it } from "vitest";
import { run } from "@/lib/db";
import { CURRENCIES, DEFAULT_CURRENCY, currencyOptions, isCurrencyCode, resolveCurrency } from "@/lib/currencies";
import { formatFeeRange } from "@/lib/fees";
import { createPractitionerManually, getPractitionerBySlug, updatePractitionerProfile } from "./practitioners";

const created: string[] = [];

afterEach(async () => {
  for (const slug of created.splice(0)) await run("DELETE FROM practitioners WHERE slug = ?", slug);
});

describe("the currency list", () => {
  it("only accepts listed codes", () => {
    expect(isCurrencyCode("PKR")).toBe(true);
    expect(isCurrencyCode("USD")).toBe(true);
    expect(isCurrencyCode("pkr")).toBe(false); // callers normalise case first
    expect(isCurrencyCode("RS")).toBe(false);
    expect(isCurrencyCode("")).toBe(false);
    expect(isCurrencyCode(undefined)).toBe(false);
  });

  it("has no duplicate codes, and the default is one of them", () => {
    const codes = CURRENCIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(isCurrencyCode(DEFAULT_CURRENCY)).toBe(true);
  });

  it("keeps a saved currency that predates the list so it isn't silently lost", () => {
    expect(currencyOptions("XYZ")[0]).toMatchObject({ value: "XYZ" });
    expect(currencyOptions("USD").map((o) => o.value)).not.toContain("XYZ");
  });
});

describe("resolving a submitted currency", () => {
  it("uses a valid choice, normalising case and spaces", () => {
    expect(resolveCurrency("usd", "PKR")).toBe("USD");
    expect(resolveCurrency("  gbp ", "PKR")).toBe("GBP");
  });

  it("never resets the saved currency when the value is missing or invalid", () => {
    expect(resolveCurrency("", "GBP")).toBe("GBP");
    expect(resolveCurrency(null, "GBP")).toBe("GBP");
    expect(resolveCurrency("not-a-currency", "GBP")).toBe("GBP");
  });

  it("falls back to the deployment default only when there is nothing saved", () => {
    expect(resolveCurrency("", undefined)).toBe(DEFAULT_CURRENCY);
  });
});

describe("practitioners and their fees", () => {
  it("a practitioner added by Super Admin starts on the deployment default currency", async () => {
    const result = await createPractitionerManually({ fullName: "Currency Tester", professionalTitle: "Counsellor", email: "currency@example.com", skipVerification: true });
    if (!result.ok) throw new Error(result.message);
    created.push(result.practitioner.slug);
    expect(result.practitioner.feeRange.currency).toBe(DEFAULT_CURRENCY);
  });

  it("a practitioner's own currency is saved and shown on the profile", async () => {
    const result = await createPractitionerManually({ fullName: "Fee Tester", professionalTitle: "Counsellor", email: "fee@example.com", skipVerification: true });
    if (!result.ok) throw new Error(result.message);
    const slug = result.practitioner.slug;
    created.push(slug);

    await updatePractitionerProfile(slug, { feeRange: { currency: "USD", min: 40, max: 60 } });
    const saved = await getPractitionerBySlug(slug);
    expect(saved?.feeRange).toEqual({ currency: "USD", min: 40, max: 60 });
    expect(formatFeeRange(saved!.feeRange)).toBe("USD 40–60");
  });
});
