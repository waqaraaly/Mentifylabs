import { afterEach, describe, expect, it, vi } from "vitest";
import { COUNTRIES } from "./countries";
import { CURRENCIES } from "./currencies";

/** The defaults are read from the environment when the module loads, so each case loads it afresh. */
async function loadWith(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) vi.stubEnv(key, "");
    else vi.stubEnv(key, value);
  }
  return import("./countries");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("the country list", () => {
  it("has unique codes, and every example number starts with a + country code", () => {
    expect(new Set(COUNTRIES.map((c) => c.code)).size).toBe(COUNTRIES.length);
    for (const c of COUNTRIES) expect(c.examplePhone).toMatch(/^\+\d{1,3} /);
  });

  it("only uses currencies the app supports", () => {
    const supported = new Set(CURRENCIES.map((c) => c.code));
    for (const c of COUNTRIES) expect(supported.has(c.currency)).toBe(true);
  });
});

describe("the phone-number example is not fixed to one country", () => {
  it("follows the configured country", async () => {
    const m = await loadWith({ NEXT_PUBLIC_DEFAULT_COUNTRY: "GB" });
    expect(m.DEFAULT_COUNTRY.code).toBe("GB");
    expect(m.phoneExample()).toBe("+44 7400 123456");
  });

  it("accepts the code in any case", async () => {
    const m = await loadWith({ NEXT_PUBLIC_DEFAULT_COUNTRY: "ae" });
    expect(m.phoneExample()).toMatch(/^\+971 /);
  });

  it("follows the default currency when no country is set", async () => {
    const m = await loadWith({ NEXT_PUBLIC_DEFAULT_COUNTRY: undefined, NEXT_PUBLIC_DEFAULT_CURRENCY: "USD" });
    expect(m.DEFAULT_COUNTRY.code).toBe("US");
    expect(m.phoneExample()).toMatch(/^\+1 /);
  });

  it("ignores an unknown country and falls back to the currency's country", async () => {
    const m = await loadWith({ NEXT_PUBLIC_DEFAULT_COUNTRY: "ZZ", NEXT_PUBLIC_DEFAULT_CURRENCY: "INR" });
    expect(m.DEFAULT_COUNTRY.code).toBe("IN");
  });

  it("still gives a usable example when nothing is configured", async () => {
    const m = await loadWith({ NEXT_PUBLIC_DEFAULT_COUNTRY: undefined, NEXT_PUBLIC_DEFAULT_CURRENCY: undefined });
    expect(m.phoneExample()).toMatch(/^\+\d+ /);
  });
});
