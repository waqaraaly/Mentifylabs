import { afterEach, describe, expect, it } from "vitest";
import { first, run } from "@/lib/db";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { deleteUserPermanently, getSuperAdmins } from "./users";

const userIds: string[] = [];
const slugs: string[] = [];

afterEach(async () => {
  for (const id of userIds.splice(0)) await run("DELETE FROM users WHERE id = ?", id);
  for (const s of slugs.splice(0)) await deleteTestPractitioner(s);
});

async function addUser(role: "admin" | "practitioner", practitionerId: string | null = null): Promise<string> {
  const email = `${role}-${Math.random().toString(16).slice(2)}@example.com`;
  const row = await first<{ id: string }>(
    "INSERT INTO users (email, name, password_hash, role, practitioner_id) VALUES (?, ?, 'x', ?, ?) RETURNING id",
    email,
    `Test ${role}`,
    role,
    practitionerId,
  );
  userIds.push(row!.id);
  return row!.id;
}

describe("the Super Admins list", () => {
  it("holds Super Admin accounts only, never practitioner logins", async () => {
    const slug = await createTestPractitioner();
    slugs.push(slug);
    const practitioner = await first<{ id: string }>("SELECT id FROM practitioners WHERE slug = ?", slug);
    const admin = await addUser("admin");
    const login = await addUser("practitioner", practitioner!.id);

    const ids = (await getSuperAdmins()).map((u) => u.id);
    expect(ids).toContain(admin);
    expect(ids).not.toContain(login);
    expect((await getSuperAdmins()).every((u) => u.role === "admin")).toBe(true);
  });
});

describe("deleting a sign-in account", () => {
  it("refuses to delete a practitioner's login, which would leave a practitioner nobody can sign in as", async () => {
    const slug = await createTestPractitioner();
    slugs.push(slug);
    const practitioner = await first<{ id: string }>("SELECT id FROM practitioners WHERE slug = ?", slug);
    const actor = await addUser("admin");
    const login = await addUser("practitioner", practitioner!.id);

    const result = await deleteUserPermanently(actor, login);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/suspend the practitioner/i);
    expect(await first("SELECT 1 FROM users WHERE id = ?", login)).toBeTruthy();
  });

  it("deletes another Super Admin, but never yourself or the last one", async () => {
    const a = await addUser("admin");
    const b = await addUser("admin");
    expect((await deleteUserPermanently(a, a)).ok).toBe(false);
    expect((await deleteUserPermanently(a, b)).ok).toBe(true);
    userIds.splice(userIds.indexOf(b), 1);
  });
});
