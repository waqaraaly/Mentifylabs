import { describe, expect, it } from "vitest";
import { isSentBack, sentBackInfo } from "./reviewQueue";

describe("who counts as sent back", () => {
  it("is an active account whose credentials were sent back with a reason and not resubmitted", () => {
    expect(isSentBack({ status: "active", verificationStatus: "unverified", verificationNote: "Blurry scan" })).toBe(true);
  });

  it("is not someone waiting for review, verified, never submitted, or suspended", () => {
    expect(isSentBack({ status: "active", verificationStatus: "pending", verificationNote: undefined })).toBe(false);
    expect(isSentBack({ status: "active", verificationStatus: "verified", verificationNote: undefined })).toBe(false);
    expect(isSentBack({ status: "active", verificationStatus: "unverified", verificationNote: undefined })).toBe(false);
    expect(isSentBack({ status: "suspended", verificationStatus: "unverified", verificationNote: "Blurry scan" })).toBe(false);
  });
});

describe("the send-back history", () => {
  it("keeps the latest date and counts the rounds for each practitioner", () => {
    const info = sentBackInfo([
      { slug: "a", kind: "verification_submitted", at: "2026-09-01T10:00:00.000Z" },
      { slug: "a", kind: "verification_rejected", at: "2026-09-02T10:00:00.000Z" },
      { slug: "a", kind: "verification_rejected", at: "2026-09-20T10:00:00.000Z" },
      { slug: "b", kind: "verification_rejected", at: "2026-09-05T10:00:00.000Z" },
      { slug: "b", kind: "verification_approved", at: "2026-09-06T10:00:00.000Z" },
    ]);
    expect(info.get("a")).toEqual({ at: "2026-09-20T10:00:00.000Z", rounds: 2 });
    expect(info.get("b")).toEqual({ at: "2026-09-05T10:00:00.000Z", rounds: 1 });
    expect(info.get("c")).toBeUndefined();
  });
});
