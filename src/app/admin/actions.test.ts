import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The actions run inside web requests: no admin session, no mail provider, no page cache. Those are replaced so the
// decision logic itself runs against the real local database.
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  requireAdmin: async () => ({ name: "Test Admin" }),
}));
const mail = { approved: true, rejected: true, reasons: [] as string[] };
vi.mock("@/lib/notifications", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/notifications")>()),
  notifyVerificationApproved: async () => mail.approved,
  notifyVerificationRejected: async (_slug: string, reason: string) => {
    mail.reasons.push(reason);
    return mail.rejected;
  },
}));

import { first, run } from "@/lib/db";
import { documentsFingerprint } from "@/lib/documentRules";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { getDocumentsByPractitioner } from "@/data/documents";
import { getPractitionerBySlug } from "@/data/practitioners";
import { getReviewEvents } from "@/data/reviewEvents";
import { approveSubmissionAction, rejectSubmissionAction } from "./actions";

let slug: string;

async function setState(fields: Record<string, string | null>) {
  const sets = Object.keys(fields).map((k) => `${k} = ?`).join(", ");
  await run(`UPDATE practitioners SET ${sets} WHERE slug = ?`, ...Object.values(fields), slug);
}

async function addDoc(name: string, withFile = true) {
  await run(
    "INSERT INTO practitioner_documents (practitioner_slug, name, category, storage_key, content_type, size_bytes) VALUES (?, ?, 'License', ?, 'application/pdf', 10)",
    slug,
    name,
    withFile ? `documents/test/${name}` : null,
  );
}

/** What the review page would send: the fingerprint of the documents on file right now. */
const seen = async () => documentsFingerprint(await getDocumentsByPractitioner(slug));

beforeEach(async () => {
  slug = await createTestPractitioner();
  mail.approved = true;
  mail.rejected = true;
  mail.reasons = [];
  await setState({ status: "active", verification_status: "pending" });
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
});

describe("approving", () => {
  it("verifies, records which documents were reviewed, and reports that the email went out", async () => {
    await addDoc("licence.pdf");
    const result = await approveSubmissionAction(slug, await seen());

    expect(result).toEqual({ ok: true, emailSent: true });
    expect(await getPractitionerBySlug(slug)).toMatchObject({ verificationStatus: "verified" });
    const approved = (await getReviewEvents(slug)).find((e) => e.kind === "verification_approved");
    expect(approved?.actorName).toBe("Test Admin");
    expect(approved?.note).toMatch(/licence\.pdf \(License, /);
  });

  it("still approves when the email fails, and says so", async () => {
    await addDoc("licence.pdf");
    mail.approved = false;
    const result = await approveSubmissionAction(slug, await seen());

    expect(result).toEqual({ ok: true, emailSent: false });
    expect(await getPractitionerBySlug(slug)).toMatchObject({ verificationStatus: "verified" });
  });

  it("refuses when there is no document file to review", async () => {
    const none = await approveSubmissionAction(slug, "");
    expect(none).toMatchObject({ ok: false, message: expect.stringMatching(/no document file/i) });

    await addDoc("demo-record.pdf", false); // a record with no file behind it is not evidence
    const noFile = await approveSubmissionAction(slug, await seen());
    expect(noFile).toMatchObject({ ok: false, message: expect.stringMatching(/no document file/i) });
    expect(await getPractitionerBySlug(slug)).toMatchObject({ verificationStatus: "pending" });
  });

  it("refuses when the documents changed after the admin opened the page", async () => {
    await addDoc("licence.pdf");
    const opened = await seen();
    await addDoc("swapped-in.pdf"); // the practitioner uploads while the admin is looking

    const result = await approveSubmissionAction(slug, opened);
    expect(result).toMatchObject({ ok: false, message: expect.stringMatching(/documents changed/i) });
    expect(await getPractitionerBySlug(slug)).toMatchObject({ verificationStatus: "pending" });
    expect((await getReviewEvents(slug)).some((e) => e.kind === "verification_approved")).toBe(false);
  });

  it.each([
    ["verified", { verification_status: "verified" }, /already approved/i],
    ["sent back", { verification_status: "unverified", verification_note: "Blurry" }, /already sent back/i],
    ["suspended", { status: "suspended" }, /suspended/i],
  ])("explains why a %s submission cannot be decided", async (_label, state, message) => {
    await addDoc("licence.pdf");
    await setState(state);
    const result = await approveSubmissionAction(slug, await seen());
    expect(result).toMatchObject({ ok: false, message: expect.stringMatching(message) });
  });

  it("reports an unknown practitioner instead of doing nothing", async () => {
    expect(await approveSubmissionAction("no-such-practitioner", "")).toMatchObject({ ok: false });
  });

  it("only one of two admins gets through, with one audit event", async () => {
    await addDoc("licence.pdf");
    const fingerprint = await seen();
    const [a, b] = await Promise.all([approveSubmissionAction(slug, fingerprint), approveSubmissionAction(slug, fingerprint)]);

    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    const events = await getReviewEvents(slug);
    expect(events.filter((e) => e.kind === "verification_approved")).toHaveLength(1);
  });
});

describe("sending back", () => {
  it("saves the reason, records who did it and emails the same reason", async () => {
    await addDoc("licence.pdf");
    const result = await rejectSubmissionAction(slug, "  Photo is blurry  ", await seen());

    expect(result).toEqual({ ok: true, emailSent: true });
    expect(await getPractitionerBySlug(slug)).toMatchObject({ verificationStatus: "unverified", verificationNote: "Photo is blurry" });
    expect(mail.reasons).toEqual(["Photo is blurry"]);
    const sentBack = (await getReviewEvents(slug)).find((e) => e.kind === "verification_rejected");
    expect(sentBack).toMatchObject({ note: "Photo is blurry", actorName: "Test Admin" });
  });

  it("reports when the email could not be sent", async () => {
    await addDoc("licence.pdf");
    mail.rejected = false;
    expect(await rejectSubmissionAction(slug, "Blurry", await seen())).toEqual({ ok: true, emailSent: false });
  });

  it("refuses when the documents changed, and when someone already decided", async () => {
    await addDoc("licence.pdf");
    const opened = await seen();
    await addDoc("extra.pdf");
    expect(await rejectSubmissionAction(slug, "x", opened)).toMatchObject({ ok: false, message: expect.stringMatching(/documents changed/i) });

    await approveSubmissionAction(slug, await seen());
    expect(await rejectSubmissionAction(slug, "too late", await seen())).toMatchObject({ ok: false, message: expect.stringMatching(/already approved/i) });
    expect(await getPractitionerBySlug(slug)).toMatchObject({ verificationStatus: "verified" });
  });

  it("writes no audit event and sends no email when it refuses", async () => {
    await addDoc("licence.pdf");
    await setState({ status: "suspended" });
    await rejectSubmissionAction(slug, "x", await seen());
    expect(mail.reasons).toEqual([]);
    const count = await first<{ n: number }>("SELECT COUNT(*) AS n FROM review_events WHERE practitioner_slug = ? AND kind = 'verification_rejected'", slug);
    expect(count?.n).toBe(0);
  });
});
