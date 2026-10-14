import { describe, expect, it } from "vitest";
import type { Practitioner } from "@/types/practitioner";
import type { Appointment } from "@/types/appointment";
import { buildReport, type ReviewEventRow } from "./reportMetrics";

const NOW = Date.parse("2026-10-30T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();

let n = 0;
const practitioner = (over: Partial<Practitioner> = {}): Practitioner =>
  ({
    slug: `p${++n}`,
    fullName: `Practitioner ${n}`,
    professionalTitle: "Counsellor",
    status: "active",
    profileStatus: "draft",
    verificationStatus: "unverified",
    dateJoined: ago(5).slice(0, 10),
    hasLogin: true,
    emailUnconfirmed: false,
    slugChosenAt: "2026-01-01T00:00:00.000Z",
    ...over,
  }) as Practitioner;

const live = (over: Partial<Practitioner> = {}) => practitioner({ profileStatus: "published", verificationStatus: "verified", ...over });

const appointment = (slug: string, createdDaysAgo: number): Appointment =>
  ({ id: `a${++n}`, practitionerSlug: slug, createdAt: ago(createdDaysAgo), date: "2026-11-01", status: "confirmed" }) as Appointment;

const report = (over: Partial<Parameters<typeof buildReport>[0]> = {}) =>
  buildReport({ practitioners: [], appointments: [], events: [], nowMs: NOW, range: 30, visitors: 0, requests: 0, ...over });

describe("the onboarding funnel", () => {
  it("only counts people who signed up in the period, and each step only counts people who passed the one before", () => {
    const a = live({ slug: "a" }); // all the way, and gets an appointment
    const b = practitioner({ slug: "b", verificationStatus: "pending" }); // submitted, not verified
    const c = practitioner({ slug: "c", emailUnconfirmed: true }); // never confirmed
    const old = live({ slug: "old", dateJoined: ago(200).slice(0, 10) }); // outside the period
    const r = report({ practitioners: [a, b, c, old], appointments: [appointment("a", 2)] });

    expect(r.funnel.cohort).toBe(3);
    expect(r.funnel.stages.map((s) => s.count)).toEqual([3, 2, 2, 1, 1, 1]);
  });

  it("counts a logged submission even if the practitioner was later sent back", () => {
    const p = practitioner({ slug: "x" });
    const events: ReviewEventRow[] = [{ slug: "x", kind: "verification_submitted", at: ago(3) }];
    expect(report({ practitioners: [p], events }).funnel.stages[2].count).toBe(1);
  });

  it("is all zeros with nobody in the period", () => {
    expect(report().funnel.stages.every((s) => s.count === 0)).toBe(true);
  });
});

describe("review queue health", () => {
  it("counts who is waiting and how long the oldest has waited", () => {
    const waiting = practitioner({ verificationStatus: "pending", verificationSubmittedAt: ago(4) });
    const suspended = practitioner({ status: "suspended", verificationStatus: "pending", verificationSubmittedAt: ago(40) });
    const r = report({ practitioners: [waiting, suspended] });
    expect(r.review.waiting).toBe(1);
    expect(Math.round(r.review.oldestWaitDays!)).toBe(4);
  });

  it("averages the days from the last submission to the approval, within the period only", () => {
    const events: ReviewEventRow[] = [
      { slug: "a", kind: "verification_submitted", at: ago(10) },
      { slug: "a", kind: "verification_approved", at: ago(8) }, // 2 days
      { slug: "b", kind: "verification_submitted", at: ago(9) },
      { slug: "b", kind: "verification_rejected", at: ago(8) },
      { slug: "b", kind: "verification_submitted", at: ago(6) },
      { slug: "b", kind: "verification_approved", at: ago(2) }, // 4 days from the latest submission
      { slug: "c", kind: "verification_submitted", at: ago(100) },
      { slug: "c", kind: "verification_approved", at: ago(90) }, // outside the period
    ];
    const r = report({ events });
    expect(r.review.approved).toBe(2);
    expect(r.review.sentBack).toBe(1);
    expect(r.review.averageDaysToApprove).toBeCloseTo(3, 5);
  });

  it("has no average when nothing was approved", () => {
    expect(report().review.averageDaysToApprove).toBeNull();
  });
});

describe("profile to appointment conversion", () => {
  it("is requests over visitors, and empty without visitors", () => {
    expect(report({ visitors: 200, requests: 10 }).conversion.rate).toBeCloseTo(5, 5);
    expect(report({ visitors: 0, requests: 3 }).conversion.rate).toBeNull();
  });
});

describe("who carries the appointments", () => {
  it("ranks by appointments in the period and shows the share the top three carry", () => {
    const [a, b, c, d] = [live({ slug: "a" }), live({ slug: "b" }), live({ slug: "c" }), live({ slug: "d" })];
    const appts = [
      ...Array.from({ length: 5 }, () => appointment("a", 3)),
      ...Array.from({ length: 3 }, () => appointment("b", 3)),
      appointment("c", 3),
      appointment("d", 3),
      appointment("a", 90), // outside the period
    ];
    const r = report({ practitioners: [a, b, c, d], appointments: appts });
    expect(r.concentration.total).toBe(10);
    expect(r.concentration.top.map((t) => [t.slug, t.share])).toEqual([["a", 50], ["b", 30], ["c", 10], ["d", 10]]);
    expect(r.concentration.top3Share).toBe(90);
  });

  it("lists the ten most requested practitioners, most requests first", () => {
    const people = Array.from({ length: 12 }, (_, i) => live({ slug: `p${i}` }));
    // p0 gets 12 requests, p1 gets 11, … p11 gets 1
    const appts = people.flatMap((p, i) => Array.from({ length: 12 - i }, () => appointment(p.slug, 3)));
    const r = report({ practitioners: people, appointments: appts });
    expect(r.concentration.top).toHaveLength(10);
    expect(r.concentration.top.map((t) => t.slug)).toEqual(people.slice(0, 10).map((p) => p.slug));
    expect(r.concentration.top[0].count).toBe(12);
  });
});

describe("lists that point at someone", () => {
  it("lists live practitioners who last signed in over a month ago, longest first", () => {
    const quiet = live({ slug: "quiet", lastSignIn: ago(50) });
    const quieter = live({ slug: "quieter", lastSignIn: ago(90) });
    const signedInLately = live({ slug: "lately", lastSignIn: ago(2) });
    const justUnder = live({ slug: "under", lastSignIn: ago(29) });
    const notLive = practitioner({ slug: "draft", lastSignIn: ago(90) });
    const r = report({ practitioners: [quiet, quieter, signedInLately, justUnder, notLive] });
    expect(r.dormant.map((d) => d.slug)).toEqual(["quieter", "quiet"]);
    expect(r.dormant[0].note).toBe("Last signed in 90 days ago");
  });

  it("goes by sign-in only: a recent appointment does not make a practitioner active", () => {
    const booked = live({ slug: "booked", lastSignIn: ago(60) });
    const r = report({ practitioners: [booked], appointments: [appointment("booked", 5)] });
    expect(r.dormant.map((d) => d.slug)).toEqual(["booked"]);
  });

  it("measures someone with no recorded sign-in from the day they joined", () => {
    const old = live({ slug: "old", dateJoined: ago(80).slice(0, 10) });
    const fresh = live({ slug: "fresh", dateJoined: ago(5).slice(0, 10) });
    const r = report({ practitioners: [old, fresh] });
    expect(r.dormant).toEqual([expect.objectContaining({ slug: "old", note: "No sign-in recorded" })]);
  });

  it("lists live practitioners who never had an appointment", () => {
    const a = live({ slug: "a" });
    const b = live({ slug: "b" });
    const r = report({ practitioners: [a, b], appointments: [appointment("a", 400)] });
    expect(r.liveNoAppointments.map((x) => x.slug)).toEqual(["b"]);
  });

});

describe("who to follow up", () => {
  const slugs = (rows: { slug: string }[]) => rows.map((x) => x.slug);

  it("puts each active, not-live practitioner under the one step they are waiting on", () => {
    const r = report({
      practitioners: [
        practitioner({ slug: "never", dateJoined: ago(12).slice(0, 10) }),
        practitioner({ slug: "back", verificationNote: "Blurry" }),
        practitioner({ slug: "unpublished", verificationStatus: "verified" }),
        practitioner({ slug: "unconfirmed", emailUnconfirmed: true }),
        practitioner({ slug: "awaiting", verificationStatus: "pending" }),
        live({ slug: "ok" }),
      ],
      events: [{ slug: "back", kind: "verification_rejected", at: ago(3) }],
    });
    expect(r.notSubmitted).toEqual([expect.objectContaining({ slug: "never", note: "Joined 12 days ago" })]);
    expect(r.sentBack).toEqual([expect.objectContaining({ slug: "back", note: "Sent back 3 days ago" })]);
    expect(slugs(r.verifiedNotLive)).toEqual(["unpublished"]);
    expect(r.cannotSignIn).toEqual([expect.objectContaining({ slug: "unconfirmed", note: "Email not confirmed" })]);
  });

  it("leaves out suspended accounts from every list", () => {
    const r = report({ practitioners: [practitioner({ slug: "s", status: "suspended" }), practitioner({ slug: "s2", status: "suspended", verificationStatus: "verified" })] });
    expect([r.notSubmitted, r.sentBack, r.verifiedNotLive, r.cannotSignIn, r.dormant, r.liveNoAppointments].flatMap(slugs)).toEqual([]);
  });

  it("says when a send-back has no recorded date instead of inventing one", () => {
    const r = report({ practitioners: [practitioner({ slug: "old", verificationNote: "Blurry" })] });
    expect(r.sentBack).toEqual([expect.objectContaining({ slug: "old", note: "Sent back" })]);
  });
});

describe("growth", () => {
  it("has twelve months, each with who joined and the running total", () => {
    const thisMonth = ago(1).slice(0, 10);
    const longAgo = "2000-01-15";
    const r = report({ practitioners: [practitioner({ dateJoined: longAgo }), live({ dateJoined: thisMonth }), practitioner({ dateJoined: thisMonth })] });
    expect(r.growth).toHaveLength(12);
    // Someone who joined years ago is already counted in the first month shown, and never counted as joining in it.
    expect(r.growth[0]).toMatchObject({ joined: 0, total: 1 });
    expect(r.growth[11]).toMatchObject({ joined: 2, total: 3 });
  });
  it("never goes down: the total only grows month to month", () => {
    const r = report({ practitioners: [practitioner({ dateJoined: ago(1).slice(0, 10) }), practitioner({ dateJoined: ago(100).slice(0, 10) })] });
    const totals = r.growth.map((g) => g.total);
    expect(totals).toEqual([...totals].sort((a, b) => a - b));
  });
});

describe("most visited profiles", () => {
  it("ranks by visitors, most first, capped at ten, leaving out anyone with none or no longer on the platform", () => {
    const people = Array.from({ length: 12 }, (_, i) => live({ slug: `v${i}`, fullName: `Name ${String(i).padStart(2, "0")}` }));
    const counts = people.map((p, i) => ({ slug: p.slug, visitors: 12 - i })); // v0 has 12 visitors … v11 has 1
    const r = report({
      practitioners: people,
      practitionerVisitors: [...counts, { slug: "gone", visitors: 99 }],
    });
    expect(r.mostVisited).toHaveLength(10);
    expect(r.mostVisited[0]).toMatchObject({ slug: "v0", note: "12 visitors" });
    expect(r.mostVisited.map((x) => x.slug)).not.toContain("gone");
  });

  it("is empty when nobody has visited, and uses the singular for one visitor", () => {
    expect(report({ practitioners: [live({ slug: "a" })], practitionerVisitors: [{ slug: "a", visitors: 0 }] }).mostVisited).toEqual([]);
    expect(report({ practitioners: [live({ slug: "a" })], practitionerVisitors: [{ slug: "a", visitors: 1 }] }).mostVisited[0].note).toBe("1 visitor");
  });
});
