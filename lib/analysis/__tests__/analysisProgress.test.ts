import { describe, expect, it } from "vitest";
import {
  getAnalysisProgressSteps,
  getStepStatus,
} from "@/lib/analysis/analysisProgress";

describe("analysisProgress", () => {
  it("defines portfolio-only progress steps", () => {
    const steps = getAnalysisProgressSteps(false);

    expect(steps).toHaveLength(2);
    expect(steps[0]?.id).toBe("github");
    expect(steps[1]?.id).toBe("generating-portfolio");
  });

  it("defines portfolio plus CV progress steps", () => {
    const steps = getAnalysisProgressSteps(true);

    expect(steps.map((step) => step.id)).toEqual([
      "cv-extract",
      "github",
      "cv-compare",
      "generating-reports",
    ]);
  });

  it("marks completed, current, and upcoming steps", () => {
    const steps = getAnalysisProgressSteps(true);

    expect(getStepStatus(steps, "github", "cv-extract")).toBe("completed");
    expect(getStepStatus(steps, "github", "github")).toBe("current");
    expect(getStepStatus(steps, "github", "generating-reports")).toBe(
      "upcoming",
    );
  });
});
