import { describe, expect, it } from "vitest";
import { getPortfolioLenses } from "@/config/analysisLenses";
import { mapLensResultToSection, mapToDeveloperPortfolioReport } from "../reportMapper";
import { createSampleEvidence } from "./fixtures";
import type { ExecutiveSummaryResult, LensAnalysisResult } from "../types";

const sampleLensResult: LensAnalysisResult = {
  score: 84,
  confidence: 91,
  summary: "The portfolio demonstrates React architecture across one repository.",
  strengths: ["React and TypeScript are evidenced."],
  concerns: ["Limited CI evidence."],
  evidence: [
    {
      repository: "dev-user/app",
      path: "package.json",
      description: "Node.js package manifest",
      facts: ["dependency: react"],
      githubUrl: "https://github.com/dev-user/app/blob/main/package.json",
    },
  ],
  recommendations: ["Add CI workflows."],
};

const executiveSummary: ExecutiveSummaryResult = {
  executiveSummary: "Solid frontend evidence with room to improve delivery practices.",
  careerLevel: "Mid-level",
  developerProfile: "Frontend-focused engineer",
  overallStrengths: ["React usage"],
  growthOpportunities: ["Expand CI coverage"],
  finalRecommendations: ["Introduce GitHub Actions"],
};

describe("reportMapper", () => {
  it("maps lens results to report sections with evidence", () => {
    const evidence = createSampleEvidence();
    const lens = getPortfolioLenses()[0];

    const section = mapLensResultToSection({
      lens,
      result: sampleLensResult,
      evidence,
    });

    expect(section.observations.length).toBeGreaterThan(0);
    expect(section.observations[0].supportingEvidence[0].path).toBe("package.json");
  });

  it("maps executive summary recommendations to improvement suggestions", () => {
    const evidence = createSampleEvidence();
    const lens = getPortfolioLenses()[0];

    const report = mapToDeveloperPortfolioReport({
      evidence,
      lensResults: [{ lens, result: sampleLensResult }],
      executiveSummary,
    });

    expect(report.improvementSuggestions).toContain("Introduce GitHub Actions");
    expect(report.sections).toHaveLength(1);
  });
});
