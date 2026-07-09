import { describe, expect, it } from "vitest";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import {
  getCvAlignmentSkipMessage,
  shouldShowCvAlignmentSection,
  shouldShowCvAlignmentSkipMessage,
} from "@/lib/presentation/cvPortfolioAlignmentPresentation";

function createBaseReport(): DeveloperPortfolioReport {
  return {
    developerSnapshot: {
      username: "dev-user",
      name: "Dev User",
      bio: null,
      totalRepositories: 1,
      primaryLanguages: ["TypeScript"],
      accountCreated: "2021-01-01T00:00:00Z",
      profileUrl: "https://github.com/dev-user",
    },
    sections: [],
    improvementSuggestions: [],
    metadata: {
      analysisSource: "mock",
      generationTimestamp: new Date().toISOString(),
    },
  };
}

describe("cvPortfolioAlignmentPresentation", () => {
  it("does not show alignment when CV is absent", () => {
    const report = createBaseReport();

    expect(shouldShowCvAlignmentSection(report)).toBe(false);
    expect(shouldShowCvAlignmentSkipMessage(report)).toBe(false);
  });

  it("shows alignment section when CV alignment report is present", () => {
    const report: DeveloperPortfolioReport = {
      ...createBaseReport(),
      cvAlignmentStatus: "completed",
      cvPortfolioAlignment: {
        summary: "Strong overlap on frontend skills.",
        overallAlignmentScore: 80,
        supportedClaims: [],
        weaklySupportedClaims: [],
        unsupportedClaims: [],
        missingCvStrengths: [],
        recommendations: [],
        metadata: {
          provider: "AzureCvPortfolioAlignment",
          generatedAt: new Date().toISOString(),
          repositoryCount: 1,
        },
      },
    };

    expect(shouldShowCvAlignmentSection(report)).toBe(true);
    expect(shouldShowCvAlignmentSkipMessage(report)).toBe(false);
  });

  it("shows skip message when alignment was skipped", () => {
    const report: DeveloperPortfolioReport = {
      ...createBaseReport(),
      cvAlignmentStatus: "skipped",
      cvAlignmentMessage:
        "CV alignment was skipped because normalized CV evidence is unavailable.",
    };

    expect(shouldShowCvAlignmentSection(report)).toBe(false);
    expect(shouldShowCvAlignmentSkipMessage(report)).toBe(true);
    expect(getCvAlignmentSkipMessage(report)).toContain("skipped");
  });
});
