import { randomBytes } from "node:crypto";
import { run } from "@/lib/db";

/**
 * Inserts a throwaway practitioner row so slot/appointment tests have a
 * valid `practitioner_slug` foreign key. Deleting it (see below) cascades
 * to every slot and appointment created under it, so tests don't need to
 * clean those up individually.
 */
export async function createTestPractitioner(): Promise<string> {
  const slug = `test-${randomBytes(6).toString("hex")}`;
  await run(
    "INSERT INTO practitioners (slug, full_name, email) VALUES (?, ?, ?)",
    slug,
    "Test Practitioner",
    `${slug}@example.com`,
  );
  return slug;
}

export async function deleteTestPractitioner(slug: string): Promise<void> {
  await run("DELETE FROM practitioners WHERE slug = ?", slug);
}
