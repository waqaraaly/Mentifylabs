import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "@/lib/db";
import { ProfileNotLive } from "@/components/practitioner/ProfileNotLive";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { isReservedNotLive } from "./practitioners";

let slug: string;
const setState = (sets: string, ...values: (string | null)[]) => run(`UPDATE practitioners SET ${sets} WHERE slug = ?`, ...values, slug);

beforeEach(async () => {
  slug = await createTestPractitioner();
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
});

describe("a link that is claimed but not live", () => {
  it("is reserved: an active account that chose its link and hasn't gone live", async () => {
    await setState("status = 'active', profile_status = 'draft', verification_status = 'unverified'");
    expect(await isReservedNotLive(slug)).toBe(true);
    await setState("verification_status = 'pending'");
    expect(await isReservedNotLive(slug)).toBe(true);
    await setState("verification_status = 'verified'"); // verified but not published yet
    expect(await isReservedNotLive(slug)).toBe(true);
  });

  it("is not reserved once the profile is live: the real page is shown instead", async () => {
    await setState("status = 'active', profile_status = 'published', verification_status = 'verified'");
    expect(await isReservedNotLive(slug)).toBe(false);
  });

  it("is not reserved when the practitioner never chose a link, so a placeholder link stays 'not found'", async () => {
    await setState("slug_chosen_at = NULL");
    expect(await isReservedNotLive(slug)).toBe(false);
  });

  it("is not reserved when an admin suspended the account or took the profile offline, so that is never revealed", async () => {
    await setState("status = 'suspended'");
    expect(await isReservedNotLive(slug)).toBe(false);
    await setState("status = 'active', profile_status = 'hidden'");
    expect(await isReservedNotLive(slug)).toBe(false);
    await setState("profile_status = 'suspended'");
    expect(await isReservedNotLive(slug)).toBe(false);
  });

  it("is not reserved for a link nobody has, or one that is a reserved word", async () => {
    expect(await isReservedNotLive("nobody-has-this-link")).toBe(false);
    expect(await isReservedNotLive("admin")).toBe(false);
    expect(await isReservedNotLive("dashboard")).toBe(false);
  });
});

describe("the not-live page", () => {
  const html = renderToStaticMarkup(createElement(ProfileNotLive));

  it("says the profile isn't live, and offers only a way back to the home page", () => {
    expect(html).toContain("isn&#x27;t live yet");
    expect(html).toContain('href="/"');
  });

  it("has nothing aimed at the practitioner, such as a sign-in prompt", () => {
    expect(html).not.toMatch(/sign in/i);
    expect(html).not.toContain("/login");
    expect(html).not.toMatch(/are you the practitioner/i);
  });

  it("shows nothing about the person", () => {
    expect(html).not.toMatch(/<img/);
    expect(html).not.toContain("—");
  });
});
