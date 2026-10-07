import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Whoever the test says is signed in, no page cache, and a redirect that stops the action the way the real one does.
let signedInPractitionerId = "";
vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  requireRole: async () => ({ practitionerId: signedInPractitionerId, role: "practitioner" }),
}));

import { first, run } from "@/lib/db";
import { createTestPractitioner, deleteTestPractitioner } from "@/test/helpers";
import { PUBLIC_NAME_MAX, tidyPublicName } from "@/lib/publicName";
import { getPractitionerBySlug } from "@/data/practitioners";
import { claimHandleAction, finishOnboardingAction, suggestHandleAction } from "./actions";

let slug: string;
const nameOf = async () => (await first<{ full_name: string }>("SELECT full_name FROM practitioners WHERE id = ?", signedInPractitionerId))?.full_name;

async function finish(fields: Record<string, string | string[]>) {
  const data = new FormData();
  data.set("slug", slug);
  data.set("professionalTitle", "Clinical Psychologist");
  for (const [k, v] of Object.entries(fields)) for (const one of [v].flat()) data.append(k, one);
  await expect(finishOnboardingAction(data)).rejects.toThrow("REDIRECT:/dashboard");
}

beforeEach(async () => {
  slug = await createTestPractitioner();
  signedInPractitionerId = (await first<{ id: string }>("SELECT id FROM practitioners WHERE slug = ?", slug))!.id;
  await run("UPDATE practitioners SET full_name = 'Name From Signup' WHERE id = ?", signedInPractitionerId);
});

afterEach(async () => {
  // By id, not by the link it started with: some tests change the link.
  await run("DELETE FROM practitioners WHERE id = ?", signedInPractitionerId);
});

describe("the name step in onboarding", () => {
  it("saves the name clients should see, in place of the one from sign-up", async () => {
    await finish({ fullName: "Dr. Ayesha Khan" });
    expect(await nameOf()).toBe("Dr. Ayesha Khan");
  });

  it("tidies stray spaces and line breaks", async () => {
    await finish({ fullName: "  Ayesha \n  Khan   " });
    expect(await nameOf()).toBe("Ayesha Khan");
  });

  it("leaves the name from sign-up when the name comes through empty", async () => {
    await finish({ fullName: "   " });
    expect(await nameOf()).toBe("Name From Signup");
  });

  it("cuts a very long name to the limit the profile editor uses", async () => {
    await finish({ fullName: "A".repeat(500) });
    expect((await nameOf())?.length).toBe(PUBLIC_NAME_MAX);
    expect(tidyPublicName("x".repeat(500)).length).toBe(PUBLIC_NAME_MAX);
  });
});

describe("what onboarding leaves alone", () => {
  const seed = async () =>
    run(
      `UPDATE practitioners SET short_bio = 'Calm routines', bio = 'My story', specializations = '["Anxiety"]', services = '["Individual Therapy"]',
              education = '["BSc, GCU, 2012–2016"]', work_experience = '["Psychologist, Clinic, 2019–Present"]',
              fee_min = 2000, fee_max = 5000, session_type = 'offline' WHERE id = ?`,
      signedInPractitionerId,
    );
  const profile = async () =>
    first<Record<string, string | number>>(
      "SELECT short_bio, bio, specializations, services, education, work_experience, fee_min, fee_max, session_type FROM practitioners WHERE id = ?",
      signedInPractitionerId,
    );

  it("doesn't touch the rest of the profile, so details an admin filled in aren't wiped by a shorter setup", async () => {
    await seed();
    const before = await profile();
    await finish({ fullName: "Ayesha Khan" });
    expect(await profile()).toEqual(before);
  });

  it("ignores those fields even if they are sent, since they are done from the dashboard checklist", async () => {
    await seed();
    const before = await profile();
    await finish({ shortBio: "Overwritten", specializations: ["X"], services: ["Y"], education: ["Z"], workExperience: ["W"], feeMin: "1", feeMax: "2" });
    expect(await profile()).toEqual(before);
  });

  it("keeps how they see clients when none is sent, and changes it when one is", async () => {
    await seed();
    await finish({ fullName: "Ayesha Khan" });
    expect((await profile())!.session_type).toBe("offline");
    await finish({ sessionType: "online" });
    expect((await profile())!.session_type).toBe("online");
  });
});

describe("the location step", () => {
  const locationOf = async () => (await getPractitionerBySlug(slug))!.location;

  it("saves where they see clients, tidied, when they see clients in person", async () => {
    await finish({ sessionType: "offline", location: "  Mind & Wellness Clinic,   Gulberg III, Lahore " });
    expect(await locationOf()).toBe("Mind & Wellness Clinic, Gulberg III, Lahore");
    await run("UPDATE practitioners SET location = NULL WHERE id = ?", signedInPractitionerId);
    await finish({ sessionType: "both", location: "Clinic Road" });
    expect(await locationOf()).toBe("Clinic Road");
  });

  it("keeps no location for an online-only profile, even if one was typed before they switched", async () => {
    await finish({ sessionType: "online", location: "Typed before switching to online" });
    expect(await locationOf() ?? "").toBe("");
  });

  it("can be left empty", async () => {
    await finish({ sessionType: "offline", location: "   " });
    expect(await locationOf() ?? "").toBe("");
  });

  it("is cut to the length the profile editor allows", async () => {
    await finish({ sessionType: "offline", location: "L".repeat(400) });
    expect((await locationOf())?.length).toBe(160);
  });
});

describe("the time zone step", () => {
  const zoneOf = async () => (await getPractitionerBySlug(slug))!.timezone;

  it("saves the zone they chose as the clock their slots and sessions run on", async () => {
    await finish({ timezone: "America/New_York" });
    expect(await zoneOf()).toBe("America/New_York");
  });

  it("keeps the zone they have when the one sent isn't a real zone, or is missing", async () => {
    await finish({ timezone: "Mars/Olympus_Mons" });
    expect(await zoneOf()).toBe("Asia/Karachi");
    await finish({});
    expect(await zoneOf()).toBe("Asia/Karachi");
  });
});

describe("the profile link step", () => {
  const slugNow = async () => (await first<{ slug: string }>("SELECT slug FROM practitioners WHERE id = ?", signedInPractitionerId))!.slug;

  it("chooses a link for someone who hasn't chosen one", async () => {
    expect(await claimHandleAction("my-first-link-choice")).toEqual({ ok: true, slug: "my-first-link-choice" });
    expect(await slugNow()).toBe("my-first-link-choice");
  });

  it("changes a link they have already chosen, so the field can stay editable", async () => {
    await claimHandleAction("my-first-link-choice");
    expect(await claimHandleAction("my-second-link-choice")).toEqual({ ok: true, slug: "my-second-link-choice" });
    expect(await slugNow()).toBe("my-second-link-choice");
  });

  it("refuses a link someone else already has, and keeps the one they have", async () => {
    await claimHandleAction("my-first-link-choice");
    const other = await createTestPractitioner();
    try {
      await run("UPDATE practitioners SET slug = 'already-in-use-link' WHERE slug = ?", other);
      const result = await claimHandleAction("already-in-use-link");
      expect(result.ok).toBe(false);
      expect(await slugNow()).toBe("my-first-link-choice");
    } finally {
      await deleteTestPractitioner("already-in-use-link");
    }
  });
});

describe("a profile link that follows the name", () => {
  it("suggests a free link made from the name they typed", async () => {
    expect(await suggestHandleAction("Ayesha Khan Test Suggestion")).toBe("ayesha-khan-test-suggestion");
  });

  it("suggests nothing when the name makes no usable link", async () => {
    expect(await suggestHandleAction("!!!")).toBe("");
    expect(await suggestHandleAction("")).toBe("");
  });

  it("suggests nothing when that link is already taken, so they can't be offered one that fails", async () => {
    const other = await createTestPractitioner();
    try {
      await run("UPDATE practitioners SET slug = 'taken-by-someone-else' WHERE slug = ?", other);
      expect(await suggestHandleAction("Taken By Someone Else")).toBe("");
    } finally {
      await deleteTestPractitioner("taken-by-someone-else");
    }
  });
});
