import { describe, expect, it } from "vitest";
import { signInDestination } from "./signInDestination";

describe("where someone goes after signing in", () => {
  it("goes to the page they asked for when it is inside their own area", () => {
    expect(signInDestination("/admin/pending", "/admin")).toBe("/admin/pending");
    expect(signInDestination(["/dashboard/slots"], "/dashboard")).toBe("/dashboard/slots");
  });

  it("goes home when there is no page, or it belongs to the other area", () => {
    expect(signInDestination(undefined, "/admin")).toBe("/admin");
    expect(signInDestination("", "/admin")).toBe("/admin");
    expect(signInDestination("/dashboard", "/admin")).toBe("/admin");
  });

  it("never leaves the site", () => {
    for (const bad of ["https://evil.example/admin", "//evil.example/admin", "/\evil.example", "admin"]) {
      expect(signInDestination(bad, "/admin")).toBe("/admin");
    }
  });
});
