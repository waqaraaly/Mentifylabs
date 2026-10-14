import { afterEach, describe, expect, it } from "vitest";
import { first, run } from "@/lib/db";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { deletePractitionerCompletely, getPractitionerBySlug } from "./practitioners";

const slugs: string[] = [];
afterEach(async () => {
  for (const s of slugs.splice(0)) await deleteTestPractitioner(s);
});

async function practitioner(): Promise<string> {
  const slug = await createTestPractitioner();
  slugs.push(slug);
  return slug;
}

const appointment = (slug: string, date: string, status: string) =>
  run(
    "INSERT INTO appointments (client_id, practitioner_slug, client_name, client_contact, date, start_time, end_time, session_type, status) VALUES ('CL-X', ?, 'Client', 'c@example.com', ?, '10:00', '10:50', 'online', ?)",
    slug,
    date,
    status,
  );

describe("deleting a practitioner completely", () => {
  it("removes the practitioner, their sign-in, appointments and documents, and returns the stored files", async () => {
    const slug = await practitioner();
    const row = await first<{ id: string }>("SELECT id FROM practitioners WHERE slug = ?", slug);
    await run("INSERT INTO users (email, name, password_hash, role, practitioner_id) VALUES (?, 'Login', 'x', 'practitioner', ?)", `${slug}@example.com`, row!.id);
    await run("UPDATE practitioners SET photo_url = ? WHERE slug = ?", "/media/photos/abc/photo.jpg", slug);
    await run("INSERT INTO practitioner_documents (practitioner_slug, name, category, storage_key) VALUES (?, 'Licence.pdf', 'License', 'documents/abc/licence.pdf')", slug);
    await appointment(slug, "2020-01-01", "completed");

    const result = await deletePractitionerCompletely(slug);
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.fileKeys.sort()).toEqual(["documents/abc/licence.pdf", "photos/abc/photo.jpg"]);

    expect(await getPractitionerBySlug(slug)).toBeNull();
    expect(await first("SELECT 1 FROM users WHERE practitioner_id = ?", row!.id)).toBeNull();
    expect(await first("SELECT 1 FROM appointments WHERE practitioner_slug = ?", slug)).toBeNull();
    expect(await first("SELECT 1 FROM practitioner_documents WHERE practitioner_slug = ?", slug)).toBeNull();
    slugs.splice(slugs.indexOf(slug), 1);
  });

  it("refuses while there are upcoming appointments, and leaves everything in place", async () => {
    const slug = await practitioner();
    await appointment(slug, "2999-01-01", "confirmed");
    const result = await deletePractitionerCompletely(slug);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/upcoming appointment/i);
    expect(await getPractitionerBySlug(slug)).not.toBeNull();
  });

  it("allows it when the only appointments are past, cancelled or completed", async () => {
    const slug = await practitioner();
    await appointment(slug, "2999-01-01", "cancelled");
    await appointment(slug, "2020-01-01", "confirmed");
    expect((await deletePractitionerCompletely(slug)).ok).toBe(true);
    slugs.splice(slugs.indexOf(slug), 1);
  });

  it("reports a practitioner that does not exist", async () => {
    expect((await deletePractitionerCompletely("no-such-practitioner")).ok).toBe(false);
  });
});
