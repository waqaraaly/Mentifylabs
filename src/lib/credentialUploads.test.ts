import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// File storage is replaced by a map in memory, so the tests can see exactly what was stored and what was cleaned up.
const bucket = new Map<string, ArrayBuffer>();
let failOnPut = 0; // make the Nth file stored fail, to test cleaning up
let puts = 0;
vi.mock("@/lib/storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/storage")>()),
  uploads: async () => ({
    put: async (key: string, bytes: ArrayBuffer) => {
      puts += 1;
      if (failOnPut && puts === failOnPut) throw new Error("storage is down");
      bucket.set(key, bytes);
    },
    delete: async (key: string) => void bucket.delete(key),
  }),
}));

import { all, run } from "@/lib/db";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { CREDENTIAL_FIELD, credentialFileField, saveCredentialUploads } from "./credentialUploads";

const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function file(name: string, type: string, signature: number[] = PDF, size = 64): File {
  const bytes = new Uint8Array(Math.max(size, signature.length));
  bytes.set(signature);
  return new File([bytes], name, { type });
}

/** A submission: the options ticked, and a file for each given option. */
function submission(items: { category: string; file?: File; ticked?: boolean }[]): FormData {
  const form = new FormData();
  for (const { category, file: f, ticked = true } of items) {
    if (ticked) form.append(CREDENTIAL_FIELD, category);
    if (f) form.set(credentialFileField(category), f);
  }
  return form;
}

let slug: string;
let practitionerId: string;
const stored = () => all<{ category: string; storage_key: string }>("SELECT category, storage_key FROM practitioner_documents WHERE practitioner_slug = ? ORDER BY category", slug);
const save = (form: FormData) => saveCredentialUploads(slug, practitionerId, form);

beforeEach(async () => {
  bucket.clear();
  failOnPut = 0;
  puts = 0;
  slug = await createTestPractitioner();
  practitionerId = (await all<{ id: string }>("SELECT id FROM practitioners WHERE slug = ?", slug))[0].id;
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
});

describe("a verification with several options", () => {
  it("saves one document for each option ticked, with the right kind on each", async () => {
    const result = await save(
      submission([
        { category: "License", file: file("licence.pdf", "application/pdf") },
        { category: "Degree", file: file("degree.png", "image/png", PNG) },
        { category: "Professional membership", file: file("membership.pdf", "application/pdf") },
      ]),
    );

    expect(result).toMatchObject({ ok: true, saved: 3, categories: ["License", "Degree", "Professional membership"] });
    expect((await stored()).map((d) => d.category)).toEqual(["Degree", "License", "Professional membership"]);
    expect(bucket.size).toBe(3);
    // Each record points at a file that is really there.
    for (const d of await stored()) expect(bucket.has(d.storage_key)).toBe(true);
  });

  it("works with a single option too", async () => {
    expect(await save(submission([{ category: "License", file: file("licence.pdf", "application/pdf") }]))).toMatchObject({ ok: true, saved: 1 });
  });

  it("needs at least one option ticked", async () => {
    expect(await save(submission([]))).toEqual({ ok: false, error: "Choose at least one way to verify yourself." });
    expect(bucket.size).toBe(0);
  });

  it("insists on a file for every option ticked, and saves nothing if one is missing", async () => {
    const result = await save(
      submission([
        { category: "License", file: file("licence.pdf", "application/pdf") },
        { category: "Degree" }, // ticked, no file
      ]),
    );
    expect(result).toEqual({ ok: false, error: "Add a file for Degree." });
    expect(await stored()).toEqual([]);
    expect(bucket.size).toBe(0);
  });

  it("ignores a file for an option that wasn't ticked", async () => {
    const result = await save(
      submission([
        { category: "License", file: file("licence.pdf", "application/pdf") },
        { category: "Degree", file: file("degree.pdf", "application/pdf"), ticked: false },
      ]),
    );
    expect(result).toMatchObject({ ok: true, saved: 1, categories: ["License"] });
  });

  it("counts an option ticked twice once", async () => {
    const form = submission([{ category: "License", file: file("licence.pdf", "application/pdf") }]);
    form.append(CREDENTIAL_FIELD, "License");
    expect(await save(form)).toMatchObject({ ok: true, saved: 1 });
  });

  it("refuses options that are no longer offered, even with a valid file", async () => {
    for (const retired of ["Certification", "Identity document", "Identity Verification"]) {
      const result = await save(submission([{ category: retired, file: file("x.pdf", "application/pdf") }]));
      expect(result).toEqual({ ok: false, error: "Choose from the list of options." });
    }
    expect(bucket.size).toBe(0);
    expect(await stored()).toEqual([]);
  });

  it("refuses an option that isn't on the list", async () => {
    const result = await save(submission([{ category: "Wizard licence", file: file("x.pdf", "application/pdf") }]));
    expect(result).toEqual({ ok: false, error: "Choose from the list of options." });
    expect(bucket.size).toBe(0);
  });
});

describe("a file that can't be used stops the whole submission", () => {
  it("rejects a file of the wrong type, naming the option, and saves nothing, not even the good files before it", async () => {
    const result = await save(
      submission([
        { category: "License", file: file("licence.pdf", "application/pdf") },
        { category: "Degree", file: file("degree.exe", "application/x-msdownload") },
      ]),
    );
    expect(result).toEqual({ ok: false, error: "Degree: upload a PDF, JPG, PNG or WebP file." });
    expect(await stored()).toEqual([]);
    expect(bucket.size).toBe(0);
  });

  it("rejects a file whose contents don't match its type, such as a renamed program", async () => {
    const result = await save(submission([{ category: "License", file: file("licence.pdf", "application/pdf", [0x4d, 0x5a, 0x90, 0x00]) }]));
    expect(result).toEqual({ ok: false, error: "License: that doesn't look like a valid PDF or image." });
    expect(bucket.size).toBe(0);
  });

  it("rejects a file over 10 MB", async () => {
    const result = await save(submission([{ category: "License", file: file("big.pdf", "application/pdf", PDF, 10 * 1024 * 1024 + 1) }]));
    expect(result).toEqual({ ok: false, error: "License: that file is too large. The limit is 10 MB." });
  });

  it("rejects a submission that adds up to more than 30 MB, though each file is allowed", async () => {
    const big = () => file("scan.pdf", "application/pdf", PDF, 10 * 1024 * 1024);
    const result = await save(
      submission([
        { category: "License", file: big() },
        { category: "Degree", file: big() },
        { category: "Experience letter", file: big() },
        { category: "Other", file: file("note.pdf", "application/pdf", PDF, 1024) },
      ]),
    );
    expect(result).toEqual({ ok: false, error: "Your files add up to more than 30 MB. Use smaller files." });
    expect(bucket.size).toBe(0);
  });

  it("stops at the number of documents one practitioner can keep", async () => {
    for (let i = 0; i < 19; i++) {
      await run("INSERT INTO practitioner_documents (practitioner_slug, name, category) VALUES (?, ?, 'Other')", slug, `old-${i}.pdf`);
    }
    const result = await save(
      submission([
        { category: "License", file: file("a.pdf", "application/pdf") },
        { category: "Degree", file: file("b.pdf", "application/pdf") },
      ]),
    );
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/up to 20 documents/) });
    expect(bucket.size).toBe(0);
  });
});

describe("when storing fails part way", () => {
  it("removes the files already stored and writes no records", async () => {
    failOnPut = 2; // the second file fails
    await expect(
      save(
        submission([
          { category: "License", file: file("licence.pdf", "application/pdf") },
          { category: "Degree", file: file("degree.pdf", "application/pdf") },
        ]),
      ),
    ).rejects.toThrow("storage is down");

    expect(bucket.size).toBe(0);
    expect(await stored()).toEqual([]);
  });
});
