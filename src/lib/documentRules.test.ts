import { describe, expect, it } from "vitest";
import { documentsFingerprint } from "./documentRules";

const doc = (id: string, hasFile = true) => ({ id, hasFile });

describe("documentsFingerprint", () => {
  it("does not depend on order", () => {
    expect(documentsFingerprint([doc("b"), doc("a")])).toBe(documentsFingerprint([doc("a"), doc("b")]));
  });
  it("changes when a document is added or removed", () => {
    expect(documentsFingerprint([doc("a")])).not.toBe(documentsFingerprint([doc("a"), doc("b")]));
    expect(documentsFingerprint([doc("a"), doc("b")])).not.toBe(documentsFingerprint([doc("a")]));
  });
  it("is empty when there are no documents", () => {
    expect(documentsFingerprint([])).toBe("");
  });
});
