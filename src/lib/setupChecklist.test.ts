import { describe, expect, it } from "vitest";
import { setupChecklist } from "./setupChecklist";

const empty = {
  photoUrl: undefined,
  bio: "",
  specializations: [] as string[],
  services: [] as string[],
  education: [] as string[],
  workExperience: [] as string[],
  feeRange: { currency: "PKR", min: 0, max: 0 },
  verificationStatus: "unverified" as const,
  verificationNote: undefined,
  profileStatus: "draft" as const,
};
const idsDone = (p: Parameters<typeof setupChecklist>[0], rules = 0) => setupChecklist(p, rules).items.filter((i) => i.done).map((i) => i.id);

describe("what is left before a profile is ready", () => {
  it("starts with nothing done for a brand new profile", () => {
    const list = setupChecklist(empty, 0);
    expect(list.done).toBe(0);
    expect(list.total).toBe(9);
  });

  it("asks for credentials and weekly hours first, because they decide whether anyone can book", () => {
    expect(setupChecklist(empty, 0).items.slice(0, 2).map((i) => i.id)).toEqual(["verify", "hours"]);
  });

  it("ticks each item when its own field is filled in", () => {
    expect(idsDone({ ...empty, photoUrl: "/media/p.jpg" })).toEqual(["photo"]);
    expect(idsDone({ ...empty, bio: "  I help people  " })).toEqual(["about"]);
    expect(idsDone({ ...empty, bio: "   " })).toEqual([]); // spaces are not a bio
    expect(idsDone({ ...empty, specializations: ["Anxiety"] })).toEqual(["areas"]);
    expect(idsDone({ ...empty, services: ["Individual Therapy"] })).toEqual(["services"]);
    expect(idsDone({ ...empty, feeRange: { currency: "PKR", min: 0, max: 3000 } })).toEqual(["fee"]);
    expect(idsDone(empty, 2)).toEqual(["hours"]);
  });

  it("counts either education or experience as the background", () => {
    expect(idsDone({ ...empty, education: ["BSc, GCU, 2012–2016"] })).toEqual(["background"]);
    expect(idsDone({ ...empty, workExperience: ["Psychologist, Clinic, 2019–Present"] })).toEqual(["background"]);
  });

  it("treats credentials as done once they are with the team, and says where they stand", () => {
    const hint = (p: Parameters<typeof setupChecklist>[0]) => setupChecklist(p, 0).items.find((i) => i.id === "verify")!;
    expect(hint({ ...empty, verificationStatus: "pending" })).toMatchObject({ done: true, hint: "Under review" });
    expect(hint({ ...empty, verificationStatus: "verified" })).toMatchObject({ done: true, hint: "Verified" });
    expect(hint({ ...empty, verificationNote: "Photo was blurry" })).toMatchObject({ done: false, hint: "Needs changes" });
    expect(hint(empty)).toMatchObject({ done: false, hint: "Needed before you can go live" });
  });

  it("is only done at the end when the profile is published", () => {
    const publish = (p: Parameters<typeof setupChecklist>[0]) => setupChecklist(p, 0).items.find((i) => i.id === "publish")!;
    expect(publish({ ...empty, verificationStatus: "verified" })).toMatchObject({ done: false, hint: "Make it visible to clients" });
    expect(publish(empty).hint).toBe("After your credentials are verified");
    expect(publish({ ...empty, verificationStatus: "verified", profileStatus: "published" }).done).toBe(true);
  });

  it("counts everything done for a finished profile", () => {
    const full = {
      photoUrl: "/media/p.jpg", bio: "Bio", specializations: ["A"], services: ["S"], education: ["E"], workExperience: [],
      feeRange: { currency: "PKR", min: 1000, max: 2000 }, verificationStatus: "verified" as const, verificationNote: undefined, profileStatus: "published" as const,
    };
    expect(setupChecklist(full, 1)).toMatchObject({ done: 9, total: 9 });
  });
});
