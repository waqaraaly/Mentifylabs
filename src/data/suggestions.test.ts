import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { countNewSuggestions, countRecentSuggestions, createSuggestion, getAllSuggestions, setSuggestionStatus } from "./suggestions";

let slug: string;

beforeEach(async () => {
  slug = await createTestPractitioner();
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
});

describe("suggestions", () => {
  it("saves what a practitioner wrote, with who sent it, as new", async () => {
    const before = await countNewSuggestions();
    await createSuggestion(slug, "Booking is slow", "Reminders");
    const mine = (await getAllSuggestions()).filter((s) => s.practitionerSlug === slug);
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ improve: "Booking is slow", features: "Reminders", status: "new" });
    expect(mine[0].practitionerName).toBeTruthy();
    expect(await countNewSuggestions()).toBe(before + 1);
  });

  it("keeps an answer that was left blank as empty, not as text", async () => {
    await createSuggestion(slug, undefined, "A calendar sync");
    const mine = (await getAllSuggestions()).filter((s) => s.practitionerSlug === slug)[0];
    expect(mine.improve).toBeUndefined();
    expect(mine.features).toBe("A calendar sync");
  });

  it("lets Super Admin mark one reviewed and back to new", async () => {
    await createSuggestion(slug, "Something", undefined);
    const id = (await getAllSuggestions()).filter((s) => s.practitionerSlug === slug)[0].id;
    const before = await countNewSuggestions();
    await setSuggestionStatus(id, "reviewed");
    expect(await countNewSuggestions()).toBe(before - 1);
    await setSuggestionStatus(id, "new");
    expect(await countNewSuggestions()).toBe(before);
  });

  it("counts a practitioner's recent suggestions, for the daily limit", async () => {
    expect(await countRecentSuggestions(slug)).toBe(0);
    await createSuggestion(slug, "One", undefined);
    await createSuggestion(slug, "Two", undefined);
    expect(await countRecentSuggestions(slug)).toBe(2);
  });

  it("goes away with the practitioner", async () => {
    await createSuggestion(slug, "Bye", undefined);
    await deleteTestPractitioner(slug);
    expect((await getAllSuggestions()).filter((s) => s.practitionerSlug === slug)).toHaveLength(0);
    slug = await createTestPractitioner();
  });
});
