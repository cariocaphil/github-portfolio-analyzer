import { describe, expect, it } from "vitest";
import { normalizeTechnologyName } from "../normalization";

describe("normalizeTechnologyName", () => {
  it("normalizes common aliases and casing", () => {
    expect(normalizeTechnologyName("node")).toBe("Node.js");
    expect(normalizeTechnologyName("NODEJS")).toBe("Node.js");
    expect(normalizeTechnologyName("reactjs")).toBe("React");
    expect(normalizeTechnologyName("typescript")).toBe("TypeScript");
  });

  it("filters obvious non-technology values", () => {
    expect(normalizeTechnologyName("Repositories with CI")).toBeNull();
    expect(normalizeTechnologyName("README.md")).toBeNull();
    expect(normalizeTechnologyName("24")).toBeNull();
    expect(normalizeTechnologyName("https://example.com/deploy")).toBeNull();
  });

  it("keeps unknown but plausible package names", () => {
    expect(normalizeTechnologyName("zod")).toBe("Zod");
    expect(normalizeTechnologyName("@tanstack/react-query")).toBe("@tanstack/react-query");
  });
});
