import { describe, expect, it } from "vitest";
import {
  canDecideSubmission,
  canReactivate,
  canReactivateLive,
  canResendConfirmation,
  canSuspend,
  headlineGroupOf,
  headlineKey,
  isLive,
} from "./practitionerState";
import { verificationState } from "./verification";

type S = Parameters<typeof headlineKey>[0];
const base: S = { status: "active", profileStatus: "draft", verificationStatus: "unverified", verificationNote: undefined };
const with_ = (over: Partial<S>): S => ({ ...base, ...over });

describe("headline status", () => {
  it("puts a suspension first", () => {
    expect(headlineKey(with_({ status: "suspended", verificationStatus: "verified", profileStatus: "suspended" }))).toBe("suspended");
  });

  it("shows a waiting submission as awaiting review", () => {
    expect(headlineKey(with_({ verificationStatus: "pending" }))).toBe("awaiting_review");
  });

  it("tells a sent-back submission apart from one never made", () => {
    expect(headlineKey(with_({ verificationNote: "Blurry scan" }))).toBe("verification_rejected");
    expect(headlineKey(with_({}))).toBe("not_verified");
  });

  it("reads a verified practitioner as live only when published", () => {
    expect(headlineKey(with_({ verificationStatus: "verified", profileStatus: "published" }))).toBe("live");
    expect(headlineKey(with_({ verificationStatus: "verified", profileStatus: "draft" }))).toBe("verified_not_live");
    expect(headlineKey(with_({ verificationStatus: "verified", profileStatus: "hidden" }))).toBe("verified_not_live");
  });
});

describe("email not confirmed", () => {
  it("shows ahead of everything except a suspension", () => {
    expect(headlineKey({ ...with_({}), emailUnconfirmed: true })).toBe("email_not_confirmed");
    expect(headlineKey({ ...with_({ verificationStatus: "pending" }), emailUnconfirmed: true })).toBe("email_not_confirmed");
    expect(headlineKey({ ...with_({ status: "suspended" }), emailUnconfirmed: true })).toBe("suspended");
  });
});

describe("invites for practitioners an admin added", () => {
  const added = { ...with_({}), creationMethod: "super_admin" as const };

  it("tells apart never invited, invited, and signed up", () => {
    expect(headlineKey({ ...added, hasLogin: false })).toBe("invite_not_sent");
    expect(headlineKey({ ...added, hasLogin: true, emailUnconfirmed: true })).toBe("invite_sent");
    expect(headlineKey({ ...added, hasLogin: true, emailUnconfirmed: false })).toBe("not_verified");
  });

  it("is not used for people who signed up themselves", () => {
    expect(headlineKey({ ...with_({}), creationMethod: "self", hasLogin: true, emailUnconfirmed: true })).toBe("email_not_confirmed");
  });

  it("asks the admin to act only on an invite that was never sent", () => {
    expect(headlineGroupOf("invite_not_sent")).toBe("action");
    expect(headlineGroupOf("invite_sent")).toBe("waiting");
  });
});

describe("groups by who acts", () => {
  it("puts only a waiting review on the admin, and the rest on the practitioner", () => {
    expect(headlineGroupOf("awaiting_review")).toBe("action");
    for (const k of ["email_not_confirmed", "not_verified", "verification_rejected", "verified_not_live"] as const) {
      expect(headlineGroupOf(k)).toBe("waiting");
    }
    expect(headlineGroupOf("live")).toBe("live");
    expect(headlineGroupOf("suspended")).toBe("suspended");
  });
});

describe("verification state", () => {
  it("tells rejected apart from never submitted", () => {
    expect(verificationState({ verificationStatus: "unverified", verificationNote: undefined })).toBe("unverified");
    expect(verificationState({ verificationStatus: "unverified", verificationNote: "Blurry scan" })).toBe("rejected");
    expect(verificationState({ verificationStatus: "pending", verificationNote: undefined })).toBe("pending");
    expect(verificationState({ verificationStatus: "verified", verificationNote: undefined })).toBe("verified");
  });
});

describe("live or not live", () => {
  const live = { status: "active", profileStatus: "published", verificationStatus: "verified" } as const;

  it("is live only when active, published and verified", () => {
    expect(isLive(live)).toBe(true);
    expect(isLive({ ...live, status: "suspended" })).toBe(false);
    expect(isLive({ ...live, verificationStatus: "pending" })).toBe(false);
    expect(isLive({ ...live, verificationStatus: "unverified" })).toBe(false);
  });

  it("treats every stored status other than published as unpublished", () => {
    for (const profileStatus of ["draft", "in_review", "hidden", "incomplete", "suspended"] as const) {
      expect(isLive({ ...live, profileStatus })).toBe(false);
    }
  });
});

describe("what Super Admin may do", () => {
  it("resends a confirmation only to self sign-ups who have not confirmed", () => {
    const base = { creationMethod: "self", emailUnconfirmed: true, hasLogin: true, status: "active" } as const;
    expect(canResendConfirmation(base)).toBe(true);
    expect(canResendConfirmation({ ...base, emailUnconfirmed: false })).toBe(false);
    expect(canResendConfirmation({ ...base, creationMethod: "super_admin" })).toBe(false);
    expect(canResendConfirmation({ ...base, status: "suspended" })).toBe(false);
  });

  it("suspends active accounts and reactivates suspended ones", () => {
    expect(canSuspend({ status: "active" })).toBe(true);
    expect(canSuspend({ status: "suspended" })).toBe(false);
    expect(canReactivate({ status: "suspended" })).toBe(true);
    expect(canReactivate({ status: "active" })).toBe(false);
  });

  it("only decides a submission that is waiting, and only restores live for verified credentials", () => {
    expect(canDecideSubmission({ verificationStatus: "pending", status: "active" })).toBe(true);
    expect(canDecideSubmission({ verificationStatus: "pending", status: "suspended" })).toBe(false);
    expect(canDecideSubmission({ verificationStatus: "verified", status: "active" })).toBe(false);
    expect(canReactivateLive({ verificationStatus: "verified" })).toBe(true);
    expect(canReactivateLive({ verificationStatus: "unverified" })).toBe(false);
  });
});
