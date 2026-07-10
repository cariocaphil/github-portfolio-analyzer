import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "@/lib/github/concurrency";

describe("mapWithConcurrency", () => {
  it("returns results in input order", async () => {
    const results = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
      return value * 2;
    });

    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it("limits concurrent in-flight work", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 10));
      inFlight -= 1;
      return true;
    });

    expect(maxInFlight).toBeLessThanOrEqual(2);
  });

  it("returns an empty array for no items", async () => {
    await expect(mapWithConcurrency([], 4, async () => "x")).resolves.toEqual([]);
  });
});
