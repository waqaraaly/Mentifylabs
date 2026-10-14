import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AboutSection } from "@/components/practitioner/AboutSection";
import type { Practitioner } from "@/types/practitioner";
import { bioOf, experienceYearsOf, headlineOf, languagesOf } from "./profileDisplay";

describe("what the public profile shows for optional fields", () => {
  it("shows a bio, trimmed, and nothing for an empty or blank one", () => {
    expect(bioOf({ bio: "  Hello there.  " })).toBe("Hello there.");
    expect(bioOf({ bio: "" })).toBeUndefined();
    expect(bioOf({ bio: "   \n  " })).toBeUndefined();
  });

  it("shows the headline the practitioner wrote, and never makes one up", () => {
    expect(headlineOf({ shortBio: "  Clinical psychologist.  " })).toBe("Clinical psychologist.");
    expect(headlineOf({ shortBio: undefined })).toBeUndefined();
    expect(headlineOf({ shortBio: "   " })).toBeUndefined();
  });

  it("treats 0 years as not filled in", () => {
    expect(experienceYearsOf({ experienceYears: 0 })).toBeUndefined();
    expect(experienceYearsOf({ experienceYears: 1 })).toBe(1);
    expect(experienceYearsOf({ experienceYears: 12 })).toBe(12);
  });
});

describe("languages on the page", () => {
  it("lists what was entered, trimmed, without blanks or repeats", () => {
    expect(languagesOf({ languages: [" English ", "Urdu", "", "  ", "english", "Punjabi"] })).toEqual(["English", "Urdu", "Punjabi"]);
  });

  it("is empty when none were added", () => {
    expect(languagesOf({ languages: [] })).toEqual([]);
  });
});

describe("the Bio on the page", () => {
  const render = (bio: string) => renderToStaticMarkup(createElement(AboutSection, { practitioner: { bio } as Practitioner }));

  it("keeps the line breaks the practitioner typed", () => {
    const html = render("First paragraph.\n\nSecond paragraph.");
    expect(html).toContain("whitespace-pre-line");
    expect(html).toContain("First paragraph.\n\nSecond paragraph.");
  });
});
