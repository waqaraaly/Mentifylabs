import { afterEach, describe, expect, it } from "vitest";
import { first, run } from "@/lib/db";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { validateHandleFormat, isPlaceholderSlug, makePlaceholderSlug } from "@/lib/handle";
import { createPractitionerManually, getPractitionerBySlug, handleProblem, suggestHandle, updatePractitionerSlug } from "./practitioners";

const made: string[] = [];
afterEach(async () => {
  for (const s of made.splice(0)) await deleteTestPractitioner(s);
});

async function practitioner(): Promise<string> {
  const slug = await createTestPractitioner();
  made.push(slug);
  return slug;
}

describe("the shape of a profile link", () => {
  it("accepts lowercase letters, numbers and single hyphens, 3 to 30 characters", () => {
    expect(validateHandleFormat("ayesha-khan")).toEqual({ ok: true, handle: "ayesha-khan" });
    expect(validateHandleFormat("  Dr-Ayesha  ")).toEqual({ ok: true, handle: "dr-ayesha" });
    expect(validateHandleFormat("a1b").ok).toBe(true);
  });

  it("rejects what cannot be a link", () => {
    for (const bad of ["ab", "a".repeat(31), "-ayesha", "ayesha-", "ay--esha", "ayesha khan", "ayesha_khan", "ayesha.khan"]) {
      expect(validateHandleFormat(bad).ok, bad).toBe(false);
    }
  });

  it("never lets someone choose a placeholder", () => {
    expect(isPlaceholderSlug(makePlaceholderSlug())).toBe(true);
    expect(validateHandleFormat("p-0a1b2c3d").ok).toBe(false);
  });
});

describe("choosing a profile link", () => {
  it("sets it, records when, and the old one stops working at once", async () => {
    const slug = await practitioner();
    const next = `handle-${slug.slice(-6)}`;
    expect(await updatePractitionerSlug(slug, next)).toEqual({ ok: true });
    made.splice(made.indexOf(slug), 1, next);
    expect(await getPractitionerBySlug(slug)).toBeNull(); // no redirect, no hold
    expect((await getPractitionerBySlug(next))?.slugChosenAt).toBeTruthy();
  });

  it("refuses a taken or reserved link", async () => {
    const a = await practitioner();
    const b = await practitioner();
    expect(await handleProblem(a, b)).toMatchObject({ ok: false, message: expect.stringMatching(/taken/i) });
    expect(await handleProblem("admin", b)).toMatchObject({ ok: false, message: expect.stringMatching(/reserved/i) });
    expect(await handleProblem(b, b)).toMatchObject({ ok: true });
  });

  it("lets a new practitioner start without any link, never one made from the name", async () => {
    const created = await createPractitionerManually({ fullName: "Handle Tester", professionalTitle: "Counsellor", email: "handle@example.com", skipVerification: false });
    if (!created.ok) throw new Error(created.message);
    made.push(created.practitioner.slug);
    expect(created.practitioner.slugChosenAt).toBeUndefined();
    expect(isPlaceholderSlug(created.practitioner.slug)).toBe(true);
    expect(created.practitioner.slug).not.toContain("handle-tester");
  });

  it("leaves the public contact details empty: the sign-in email is not copied onto the profile", async () => {
    const created = await createPractitionerManually({ fullName: "Contact Tester", professionalTitle: "Counsellor", email: "contact@example.com", skipVerification: false });
    if (!created.ok) throw new Error(created.message);
    made.push(created.practitioner.slug);
    expect(created.practitioner.email).toBe("contact@example.com");
    expect(created.practitioner.contactMethods.every((c) => c.value === "")).toBe(true);
  });

  it("offers a free handle from the name as a starting point", async () => {
    expect(await suggestHandle("Zubair Handle-Suggest")).toBe("zubair-handle-suggest");
  });
});

describe("giving up a handle nobody verified for", () => {
  const stale = (slug: string, over: { verification?: string; profile?: string; joined?: string }) =>
    run(
      "UPDATE practitioners SET verification_status = ?, profile_status = ?, date_joined = ? WHERE slug = ?",
      over.verification ?? "unverified",
      over.profile ?? "draft",
      over.joined ?? "2020-01-01",
      slug,
    );

  it("frees a handle held by an old unverified account, and gives that account a placeholder", async () => {
    const holder = await practitioner();
    const newcomer = await practitioner();
    await stale(holder, {});
    expect(await updatePractitionerSlug(newcomer, holder)).toEqual({ ok: true });
    made.splice(made.indexOf(newcomer), 1, holder);

    const moved = await first<{ slug: string; slug_chosen_at: string | null }>(
      "SELECT slug, slug_chosen_at FROM practitioners WHERE slug <> ? AND email = ?",
      holder,
      `${holder}@example.com`,
    );
    expect(moved && isPlaceholderSlug(moved.slug)).toBe(true);
    expect(moved?.slug_chosen_at).toBeNull();
    if (moved) made.push(moved.slug);
  });

  it("keeps a handle that is recent, verified or live", async () => {
    for (const over of [{ joined: new Date().toISOString().slice(0, 10) }, { verification: "verified" }, { profile: "published", verification: "verified" }]) {
      const holder = await practitioner();
      const other = await practitioner();
      await stale(holder, over);
      expect(await handleProblem(holder, other)).toMatchObject({ ok: false, message: expect.stringMatching(/taken/i) });
    }
  });
});
