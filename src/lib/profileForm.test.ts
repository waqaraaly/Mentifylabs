import { describe, expect, it } from "vitest";
import { PROFILE_LIMITS, parseProfileForm } from "./profileForm";

function form(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) for (const one of [value].flat()) data.append(key, one);
  return data;
}
const parse = (fields: Record<string, string | string[]>, currency = "PKR") => parseProfileForm(form(fields), currency);

describe("what the profile editor's form says about the profile", () => {
  it("trims the text fields and cuts them at the limits", () => {
    const p = parse({ fullName: "  Ayesha Khan  ", professionalTitle: "x".repeat(500), bio: "y".repeat(9000) });
    expect(p.fullName).toBe("Ayesha Khan");
    expect(p.professionalTitle).toHaveLength(PROFILE_LIMITS.title);
    expect(p.bio).toHaveLength(PROFILE_LIMITS.bio);
  });

  it("treats an empty headline or location as none, not as an empty string", () => {
    const p = parse({ shortBio: "   ", location: "" });
    expect(p.shortBio).toBeUndefined();
    expect(p.location).toBeUndefined();
  });

  it("tidies each list: blanks dropped, entries trimmed and limited, no more than 30", () => {
    const many = Array.from({ length: 40 }, (_, i) => `Area ${i}`);
    const p = parse({ specializations: ["  Anxiety ", "", "   ", "x".repeat(500)], services: many });
    expect(p.specializations).toEqual(["Anxiety", "x".repeat(PROFILE_LIMITS.item)]);
    expect(p.services).toHaveLength(PROFILE_LIMITS.items);
  });

  it("keeps years of experience a whole number between 0 and 80", () => {
    expect(parse({ experienceYears: "7.9" }).experienceYears).toBe(7);
    expect(parse({ experienceYears: "-3" }).experienceYears).toBe(0);
    expect(parse({ experienceYears: "500" }).experienceYears).toBe(PROFILE_LIMITS.years);
    expect(parse({ experienceYears: "abc" }).experienceYears).toBe(0);
  });

  it("takes the fee either way round, never negative, and keeps the saved currency when none or an odd one is sent", () => {
    expect(parse({ feeMin: "5000", feeMax: "2000" }).feeRange).toEqual({ currency: "PKR", min: 2000, max: 5000 });
    expect(parse({ feeMin: "-10", feeMax: "300" }).feeRange).toMatchObject({ min: 0, max: 300 });
    expect(parse({ feeCurrency: "NOPE" }, "AED").feeRange?.currency).toBe("AED");
    expect(parse({ feeCurrency: "usd" }, "AED").feeRange?.currency).toBe("USD");
  });

  it("only accepts a real session type, and a real theme", () => {
    expect(parse({ sessionType: "offline" }).sessionType).toBe("offline");
    expect(parse({ sessionType: "teleport" }).sessionType).toBe("both");
    expect(parse({ colorTheme: "ink-blue" }).colorTheme).toBe("ink-blue");
    expect(parse({ colorTheme: "pitch-black" }).colorTheme).toBe("moss-honey");
  });

  it("keeps contact details that have a label, even if the value is empty, and which are public", () => {
    const p = parse({ contactLabel: ["Email", "Phone", " "], contactValue: ["a@b.co", ""], contactPublic: ["true", "false", "true"] });
    expect(p.contactMethods).toEqual([
      { label: "Email", value: "a@b.co", isPublic: true },
      { label: "Phone", value: "", isPublic: false },
    ]);
  });

  it("keeps only web links, and only for the supported platforms", () => {
    const p = parse({ social_instagram: "https://instagram.com/dr.khan", social_facebook: "javascript:alert(1)", social_linkedin: "", websiteUrl: "https://example.com" });
    expect(p.socialLinks).toEqual([{ platform: "instagram", url: "https://instagram.com/dr.khan" }]);
    expect(p.websiteUrl).toBe("https://example.com");
  });
});
