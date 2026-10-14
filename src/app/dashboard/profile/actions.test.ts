import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The action runs inside a web request: no signed-in session and no page cache. The session is replaced by "whoever the
// test says is signed in", so the real action and the real database are what is being checked.
let signedInPractitionerId = "";
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  requireRole: async () => ({ practitionerId: signedInPractitionerId, role: "practitioner" }),
}));

import { randomBytes } from "node:crypto";
import { first, run } from "@/lib/db";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { updateProfileAction, updateSlugAction } from "./actions";

const made: string[] = [];
const unique = () => `handle-${randomBytes(4).toString("hex")}`;

interface Row {
  id: string;
  slug: string;
  slug_chosen_at: string | null;
}
const byId = (id: string) => first<Row>("SELECT id, slug, slug_chosen_at FROM practitioners WHERE id = ?", id);

/** A practitioner who hasn't chosen a link yet: they hold a hidden placeholder slug and no choice is recorded. */
async function practitionerWithoutChosenLink(): Promise<Row> {
  const slug = await createTestPractitioner();
  made.push(slug);
  const placeholder = `p-${randomBytes(4).toString("hex")}`;
  await run("UPDATE practitioners SET slug = ?, slug_chosen_at = NULL WHERE slug = ?", placeholder, slug);
  made[made.length - 1] = placeholder;
  const row = await first<Row>("SELECT id, slug, slug_chosen_at FROM practitioners WHERE slug = ?", placeholder);
  signedInPractitionerId = row!.id;
  return row!;
}

beforeEach(() => {
  signedInPractitionerId = "";
});

afterEach(async () => {
  for (const slug of made.splice(0)) await deleteTestPractitioner(slug);
});

describe("choosing a profile link", () => {
  it("works for someone who has not chosen one yet, with no link of the browser's to match", async () => {
    const before = await practitionerWithoutChosenLink();
    expect(before.slug_chosen_at).toBeNull();

    const wanted = unique();
    const result = await updateSlugAction(wanted);

    expect(result).toEqual({ ok: true });
    const after = await byId(before.id);
    expect(after?.slug).toBe(wanted);
    expect(after?.slug_chosen_at).not.toBeNull();
    made[made.length - 1] = wanted;
  });

  it("works for changing a link that was already chosen", async () => {
    const before = await practitionerWithoutChosenLink();
    const first = unique();
    expect(await updateSlugAction(first)).toEqual({ ok: true });
    made[made.length - 1] = first;

    const second = unique();
    expect(await updateSlugAction(second)).toEqual({ ok: true });
    expect((await byId(before.id))?.slug).toBe(second);
    made[made.length - 1] = second;
  });

  it("refuses a link someone else already has, and changes nothing", async () => {
    const other = await createTestPractitioner();
    made.push(other);
    const mine = await practitionerWithoutChosenLink();

    const result = await updateSlugAction(other);
    expect(result.ok).toBe(false);
    expect((await byId(mine.id))?.slug).toBe(mine.slug);
  });

  it("refuses something that can't be a link", async () => {
    const mine = await practitionerWithoutChosenLink();
    for (const bad of ["", "a", "Two Words", "no_underscores", "x".repeat(80)]) {
      expect((await updateSlugAction(bad)).ok).toBe(false);
    }
    expect((await byId(mine.id))?.slug).toBe(mine.slug);
  });

  it("can only ever rename the signed-in practitioner", async () => {
    const other = await createTestPractitioner();
    made.push(other);
    const mine = await practitionerWithoutChosenLink();

    expect(await updateSlugAction(unique())).toEqual({ ok: true });
    // The other practitioner's link is untouched.
    expect((await first<Row>("SELECT id, slug, slug_chosen_at FROM practitioners WHERE slug = ?", other))?.slug).toBe(other);
    const renamed = await byId(mine.id);
    made[made.length - 1] = renamed!.slug;
  });
});

describe("saving the profile", () => {
  async function save(slug: string, languages: string[]) {
    const form = new FormData();
    form.set("slug", slug);
    form.set("fullName", "Test Practitioner");
    form.set("professionalTitle", "Counsellor");
    for (const language of languages) form.append("languages", language);
    await updateProfileAction(form);
  }
  const storedLanguages = async (id: string) =>
    JSON.parse((await first<{ languages: string }>("SELECT languages FROM practitioners WHERE id = ?", id))!.languages) as string[];

  it("saves the languages from the editor, trimmed and without blanks", async () => {
    const mine = await practitionerWithoutChosenLink();
    await save(mine.slug, ["  English ", "Urdu", "", "   "]);
    expect(await storedLanguages(mine.id)).toEqual(["English", "Urdu"]);
  });

  it("clears them when the list is emptied", async () => {
    const mine = await practitionerWithoutChosenLink();
    await save(mine.slug, ["English"]);
    await save(mine.slug, []);
    expect(await storedLanguages(mine.id)).toEqual([]);
  });

  it("no longer keeps certifications on a practitioner", async () => {
    const mine = await practitionerWithoutChosenLink();
    const { getPractitionerBySlug } = await import("@/data/practitioners");
    expect(Object.keys((await getPractitionerBySlug(mine.slug))!)).not.toContain("certifications");
  });
});
