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
});

describe("lists that point at someone", () => {
  it("lists live practitioners quiet for a month, longest first, and ignores the recently active", () => {
    const quiet = live({ slug: "quiet", lastSignIn: ago(50) });
    const quieter = live({ slug: "quieter", lastSignIn: ago(90) });
    const signedInLately = live({ slug: "lately", lastSignIn: ago(2) });
    const hadAppointment = live({ slug: "booked", lastSignIn: ago(60) });
    const notLive = practitioner({ slug: "draft", lastSignIn: ago(90) });
    const r = report({
      practitioners: [quiet, quieter, signedInLately, hadAppointment, notLive],
      appointments: [appointment("booked", 5)],
    });
    expect(r.dormant.map((d) => d.slug)).toEqual(["quieter", "quiet"]);
  });

  it("lists live practitioners who never had an appointment", () => {
    const a = live({ slug: "a" });
    const b = live({ slug: "b" });
    const r = report({ practitioners: [a, b], appointments: [appointment("a", 400)] });
    expect(r.liveNoAppointments.map((x) => x.slug)).toEqual(["b"]);
  });

  it("lists active practitioners who are not live, with where they are stuck, and leaves out suspended ones", () => {
    const awaiting = practitioner({ slug: "awaiting", verificationStatus: "pending" });
    const suspended = practitioner({ slug: "suspended", status: "suspended" });
    const r = report({ practitioners: [awaiting, suspended, live({ slug: "ok" })] });
    expect(r.stuck).toEqual([expect.objectContaining({ slug: "awaiting", note: "Awaiting review" })]);
  });
});

describe("growth", () => {
  it("has seven months, with how many of each month's joiners are live today", () => {
    const thisMonth = ago(1).slice(0, 10);
    const r = report({ practitioners: [live({ dateJoined: thisMonth }), practitioner({ dateJoined: thisMonth })] });
    expect(r.growth).toHaveLength(7);
    expect(r.growth[6]).toMatchObject({ new: 2, active: 1 });
  });
});
