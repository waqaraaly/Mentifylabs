import { describe, expect, it } from "vitest";
import { adminLinkEmail } from "./adminLinkEmail";

const base = { link: "https://example.com/reset-password?token=abc&invite=1", days: 7, name: "Ayesha" };

describe("the email Super Admin sends a practitioner", () => {
  it("invites someone who has never signed in, instead of asking them to set a password", () => {
    const m = adminLinkEmail({ ...base, invite: true });
    expect(m.subject).toMatch(/invited/i);
    expect(m.content.heading).toMatch(/invited/i);
    expect(m.content.button).toEqual({ label: "Accept invitation", url: base.link });
    expect(JSON.stringify(m)).not.toMatch(/set your password/i);
  });

  it("sends a password reset to someone who already has an account", () => {
    const m = adminLinkEmail({ ...base, invite: false });
    expect(m.subject).toMatch(/reset/i);
    expect(m.content.button.label).toBe("Choose a new password");
    expect(m.content.heading).not.toMatch(/invited/i);
  });

  it("says how long the link lasts and greets them by name", () => {
    const m = adminLinkEmail({ ...base, invite: true });
    expect(m.greeting).toBe("Hi Ayesha,");
    expect(m.content.footnote).toContain("7 days");
  });
});
