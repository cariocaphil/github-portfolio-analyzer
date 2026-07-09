import { describe, expect, it } from "vitest";
import {
  aggregateConfidence,
  clampConfidence,
  confidenceToLevel,
} from "../confidence";

describe("confidence", () => {
  it("aggregates confidence values", () => {
    expect(aggregateConfidence([80, 60, 90])).toEqual({
      averageConfidence: 77,
      highestConfidence: 90,
      lowestConfidence: 60,
    });
  });

  it("maps numeric confidence to report levels", () => {
    expect(confidenceToLevel(90)).toBe("high");
    expect(confidenceToLevel(60)).toBe("medium");
    expect(confidenceToLevel(30)).toBe("low");
  });

  it("clamps confidence between 0 and 100", () => {
    expect(clampConfidence(150)).toBe(100);
    expect(clampConfidence(-5)).toBe(0);
  });
});
