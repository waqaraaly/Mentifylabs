import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Whoever the test says is signed in, no page cache, and file storage in memory: the real action and database run.
let signedInPractitionerId = "";
const bucket = new Map<string, ArrayBuffer>();
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  requireRole: async () => ({ practitionerId: signedInPractitionerId, role: "practitioner" }),
}));
vi.mock("@/lib/storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/storage")>()),
  uploads: async () => ({
    put: async (key: string, bytes: ArrayBuffer) => void bucket.set(key, bytes),
    delete: async (key: string) => void bucket.delete(key),
  }),
}));

import { first, run } from "@/lib/db";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { getReviewEvents } from "@/data/reviewEvents";
import { CREDENTIAL_FIELD, credentialFileField } from "@/lib/credentialUploads";
import { submitVerificationAction } from "./actions";

const pdf = (name: string) => new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 1, 2, 3])], name, { type: "application/pdf" });

function form(slug: string, items: { category: string; file?: File }[]): FormData {
  const data = new FormData();
  data.set("slug", slug);
  for (const { category, file } of items) {
    data.append(CREDENTIAL_FIELD, category);
    if (file) data.set(credentialFileField(category), file);
  }
  return data;
}

let slug: string;
const status = async () => (await first<{ verification_status: string }>("SELECT verification_status FROM practitioners WHERE slug = ?", slug))?.verification_status;
const documentCount = async () => (await first<{ n: number }>("SELECT count(*) AS n FROM practitioner_documents WHERE practitioner_slug = ?", slug))?.n ?? 0;

beforeEach(async () => {
  bucket.clear();
  slug = await createTestPractitioner();
  signedInPractitionerId = (await first<{ id: string }>("SELECT id FROM practitioners WHERE slug = ?", slug))!.id;
  await run("UPDATE practitioners SET verification_status = 'unverified', verification_note = NULL WHERE slug = ?", slug);
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
});

describe("submitting a verification", () => {
  it("sends the whole submission for review once, and records what was in it", async () => {
    const result = await submitVerificationAction({}, form(slug, [
      { category: "License", file: pdf("licence.pdf") },
      { category: "Degree", file: pdf("degree.pdf") },
    ]));

    expect(result).toEqual({ submitted: true });
    expect(await status()).toBe("pending");
    expect(await documentCount()).toBe(2);
    const submitted = (await getReviewEvents(slug)).filter((e) => e.kind === "verification_submitted");
    expect(submitted).toHaveLength(1);
    expect(submitted[0].note).toBe("Submitted: License, Degree");
  });

  it("changes nothing when nothing is ticked", async () => {
    const result = await submitVerificationAction({}, form(slug, []));
    expect(result).toEqual({ error: "Choose at least one way to verify yourself." });
    expect(await status()).toBe("unverified");
    expect(await documentCount()).toBe(0);
    expect((await getReviewEvents(slug)).filter((e) => e.kind === "verification_submitted")).toHaveLength(0);
  });

  it("changes nothing when an option is ticked without a file", async () => {
    const result = await submitVerificationAction({}, form(slug, [
      { category: "License", file: pdf("licence.pdf") },
      { category: "Professional membership" },
    ]));
    expect(result).toEqual({ error: "Add a file for Professional membership." });
    expect(await status()).toBe("unverified");
    expect(await documentCount()).toBe(0);
    expect(bucket.size).toBe(0);
  });

  it("clears the reason from an earlier send-back once they submit again", async () => {
    await run("UPDATE practitioners SET verification_note = 'Photo was blurry' WHERE slug = ?", slug);
    await submitVerificationAction({}, form(slug, [{ category: "License", file: pdf("licence-2.pdf") }]));
    const row = await first<{ verification_status: string; verification_note: string | null }>("SELECT verification_status, verification_note FROM practitioners WHERE slug = ?", slug);
    expect(row).toEqual({ verification_status: "pending", verification_note: null });
  });

  it("keeps someone who is already verified verified when they add more documents", async () => {
    await run("UPDATE practitioners SET verification_status = 'verified' WHERE slug = ?", slug);
    await submitVerificationAction({}, form(slug, [{ category: "Experience letter", file: pdf("extra.pdf") }]));
    expect(await status()).toBe("verified");
    expect(await documentCount()).toBe(1);
    expect((await getReviewEvents(slug)).filter((e) => e.kind === "verification_submitted")).toHaveLength(0);
  });
});
