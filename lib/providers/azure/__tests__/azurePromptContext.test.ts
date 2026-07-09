import { describe, expect, it } from "vitest";
import { getPortfolioLenses } from "@/config/analysisLenses";
import {
  buildLensPortfolioSummaryMarkdown,
} from "../portfolioContextBuilder";
import { formatLensAnalysesForExecutiveSummary } from "../reportMapper";
import { createSampleEvidence } from "./fixtures";
import type { LensAnalysisResult } from "../types";

describe("azure prompt context compaction", () => {
  it("builds lens-specific portfolio summaries instead of full markdown", () => {
    const evidence = createSampleEvidence();
    const technicalBreadth = buildLensPortfolioSummaryMarkdown(
      "technical-breadth",
      evidence,
    );
    const projectComplexity = buildLensPortfolioSummaryMarkdown(
      "project-complexity",
      evidence,
    );

    expect(technicalBreadth).toContain("Primary languages:");
    expect(technicalBreadth).toContain("Technologies:");
    expect(technicalBreadth).not.toContain("Repositories with README");

    expect(projectComplexity).toContain("Repositories with tests:");
    expect(projectComplexity).toContain("Repositories with CI:");
    expect(projectComplexity).not.toContain("Primary languages:");
  });

  it("formats compact executive summary lens payloads", () => {
    const lens = getPortfolioLenses()[0];
    const result: LensAnalysisResult = {
      score: 84,
      confidence: 91,
      summary: "Strong React evidence.",
      strengths: ["React", "TypeScript", "Extra strength"],
      concerns: ["Limited CI", "Sparse docs"],
      evidence: [],
      recommendations: ["Add CI", "Add tests", "Add docs"],
    };

    const formatted = formatLensAnalysesForExecutiveSummary([{ lens, result }]);
    const parsed = JSON.parse(formatted) as Array<Record<string, unknown>>;

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      lensId: lens.id,
      score: 84,
      summary: "Strong React evidence.",
    });
    expect(parsed[0].topStrengths).toEqual(["React", "TypeScript"]);
    expect(parsed[0].topConcerns).toEqual(["Limited CI", "Sparse docs"]);
    expect(parsed[0].topRecommendations).toEqual(["Add CI", "Add tests"]);
    expect(formatted).not.toContain("supportingEvidence");
  });
});
