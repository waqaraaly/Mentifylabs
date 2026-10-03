import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "@/lib/db";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import {
  approveSubmission,
  createPractitionerManually,
  getPractitionerBySlug,
  getPublicPractitionerBySlug,
  getPublicPractitionerSlugs,
  isPubliclyVisible,
  publishOwnProfile,
  reactivatePractitioner,
  unpublishOwnProfile,
} from "./practitioners";
import { publishBlockReason } from "@/lib/verification";

let slug: string;
const created: string[] = [];

/** A throwaway practitioner in an exact state, so each rule is tested on its own. */
async function setState(fields: { status?: string; profile_status?: string; verification_status?: string; verification_note?: string | null }) {
  const sets = Object.keys(fields).map((k) => `${k} = ?`).join(", ");
  await run(`UPDATE practitioners SET ${sets} WHERE slug = ?`, ...Object.values(fields) as (string | null)[], slug);
}

beforeEach(async () => {
  slug = await createTestPractitioner();
});

afterEach(async () => {
  await deleteTestPractitioner(slug);
  for (const s of created.splice(0)) await deleteTestPractitioner(s);
});

describe("publishing needs verified credentials", () => {
  it("refuses an unverified practitioner", async () => {
    await setState({ status: "active", verification_status: "unverified" });
    const result = await publishOwnProfile(slug);
    expect(result.ok).toBe(false);
    expect((await getPractitionerBySlug(slug))?.profileStatus).not.toBe("published");
  });

  it("refuses while the credentials are pending review", async () => {
    await setState({ status: "active", verification_status: "pending" });
    const result = await publishOwnProfile(slug);
    expect(result).toMatchObject({ ok: false });
    expect((result as { message: string }).message).toMatch(/under review/i);
  });

  it("refuses after Super Admin sent the submission back", async () => {
    await setState({ status: "active", verification_status: "unverified", verification_note: "The document is blurry." });
    const result = await publishOwnProfile(slug);
    expect(result).toMatchObject({ ok: false });
    expect((result as { message: string }).message).toMatch(/need changes/i);
  });

  it("refuses when the account isn't active", async () => {
    await setState({ status: "pending", verification_status: "verified" });
    expect((await publishOwnProfile(slug)).ok).toBe(false);
  });

  it("refuses a profile an admin took offline", async () => {
    await setState({ status: "active", verification_status: "verified", profile_status: "hidden" });
    expect((await publishOwnProfile(slug)).ok).toBe(false);
  });

  it("lets a verified, active practitioner publish, and unpublish again", async () => {
    await setState({ status: "active", verification_status: "verified" });
    expect(await publishOwnProfile(slug)).toEqual({ ok: true });
    expect((await getPractitionerBySlug(slug))?.profileStatus).toBe("published");

    expect(await unpublishOwnProfile(slug)).toEqual({ ok: true });
    expect((await getPractitionerBySlug(slug))?.profileStatus).toBe("draft");
    // ...and nothing was lost: they can publish again.
    expect(await publishOwnProfile(slug)).toEqual({ ok: true });
  });

  it("only unpublishes a profile that is actually published", async () => {
    await setState({ status: "active", verification_status: "verified", profile_status: "draft" });
    expect((await unpublishOwnProfile(slug)).ok).toBe(false);
  });

  it("explains each blocked case in words", () => {
    const base = { status: "active", profileStatus: "draft", verificationStatus: "unverified", verificationNote: undefined } as const;
    expect(publishBlockReason({ ...base })).toMatch(/verify your credentials/i);
    expect(publishBlockReason({ ...base, verificationStatus: "pending" })).toMatch(/under review/i);
    expect(publishBlockReason({ ...base, verificationNote: "Expired." })).toMatch(/need changes/i);
    expect(publishBlockReason({ ...base, profileStatus: "hidden" })).toMatch(/offline/i);
    expect(publishBlockReason({ ...base, verificationStatus: "verified" })).toBeNull();
  });
});

describe("approving never publishes", () => {
  it("verifies and activates a pending account but leaves the profile unpublished", async () => {
    await setState({ status: "pending", verification_status: "pending", profile_status: "draft" });
    await approveSubmission(slug);

    const p = await getPractitionerBySlug(slug);
    expect(p).toMatchObject({ verificationStatus: "verified", status: "active" });
    expect(p?.profileStatus).toBe("draft");
    expect(p ? isPubliclyVisible(p) : true).toBe(false);
  });

  it("reactivating a suspended account leaves the profile for the practitioner to republish", async () => {
    await setState({ status: "suspended", profile_status: "suspended", verification_status: "verified" });
    await reactivatePractitioner(slug);
    const p = await getPractitionerBySlug(slug);
    expect(p).toMatchObject({ status: "active", profileStatus: "draft" });
    // a draft (not "hidden"), so they can publish it themselves
    expect(publishBlockReason(p!)).toBeNull();
  });
});

describe("what the public can see", () => {
  it("hides a published profile whose credentials aren't verified", async () => {
    await setState({ status: "active", profile_status: "published", verification_status: "pending" });
    expect(await getPublicPractitionerBySlug(slug)).toBeNull();
    expect(await getPublicPractitionerSlugs()).not.toContain(slug);
  });

  it("shows a published profile once it is verified, active and published", async () => {
    await setState({ status: "active", profile_status: "published", verification_status: "verified" });
    expect((await getPublicPractitionerBySlug(slug))?.slug).toBe(slug);
    expect(await getPublicPractitionerSlugs()).toContain(slug);
  });

  it("never shows a draft, even for a verified practitioner", async () => {
    await setState({ status: "active", profile_status: "draft", verification_status: "verified" });
    expect(await getPublicPractitionerBySlug(slug)).toBeNull();
  });
});

describe("practitioners added by Super Admin", () => {
  it("'Skip verification' makes them verified and active, as a draft they can publish", async () => {
    const result = await createPractitionerManually({ fullName: "Skip Tester", professionalTitle: "Counsellor", email: "skip@example.com", skipVerification: true });
    if (!result.ok) throw new Error(result.message);
    created.push(result.practitioner.slug);

    expect(result.practitioner).toMatchObject({ status: "active", verificationStatus: "verified", profileStatus: "draft" });
    expect(publishBlockReason(result.practitioner)).toBeNull();
    expect(await publishOwnProfile(result.practitioner.slug)).toEqual({ ok: true });
  });

  it("without 'Skip verification' they start pending and unverified, and can't publish", async () => {
    const result = await createPractitionerManually({ fullName: "Review Tester", professionalTitle: "Counsellor", email: "review@example.com", skipVerification: false });
    if (!result.ok) throw new Error(result.message);
    created.push(result.practitioner.slug);

    expect(result.practitioner).toMatchObject({ status: "pending", verificationStatus: "unverified" });
    expect((await publishOwnProfile(result.practitioner.slug)).ok).toBe(false);
  });
});
