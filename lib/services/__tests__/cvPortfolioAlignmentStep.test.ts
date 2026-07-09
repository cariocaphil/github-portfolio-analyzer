import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import type { UnifiedPortfolioEvidenceModel } from "@/lib/models/portfolio";

const alignCvWithPortfolio = vi.fn();

vi.mock("@/lib/cvPortfolioAlignment", () => ({
  alignCvWithPortfolio,
}));

vi.mock("@/lib/azure/cvAlignmentLogger", () => ({
  logCvAlignmentEvent: vi.fn(),
}));

function createCandidateEvidence(): CandidateEvidenceModel {
  return {
    personalInformation: { confidence: 0.9, websites: [] },
    executiveSummary: { confidence: 0.8, text: "Full-stack engineer" },
    skills: { confidence: 0.9, entries: ["React", "TypeScript"] },
    employmentHistory: { confidence: 0.8, entries: [] },
    education: { confidence: 0.7, entries: [] },
    certifications: { confidence: 0.6, entries: [] },
    projects: { confidence: 0.7, entries: [] },
    languages: { confidence: 0.7, entries: [] },
  };
}

function createReport(): DeveloperPortfolioReport {
  return {
    developerSnapshot: {
      username: "dev-user",
      name: "Dev User",
      bio: null,
      totalRepositories: 2,
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

function createPortfolioEvidence(): UnifiedPortfolioEvidenceModel {
  return {
    profile: {
      username: "dev-user",
      name: "Dev User",
      bio: null,
      avatarUrl: null,
      publicRepos: 2,
      followers: 0,
      following: 0,
      createdAt: "2021-01-01T00:00:00Z",
      url: "https://github.com/dev-user",
    },
    repositoryProfiles: [],
    aggregatedTechnologies: ["TypeScript", "React"],
    evidenceSources: [],
    summary: {
      totalRepositories: 2,
      repositoriesWithReadme: 1,
      repositoriesWithTests: 1,
      repositoriesWithCi: 0,
      repositoriesWithDocker: 0,
      repositoriesWithDeploymentConfig: 0,
      primaryLanguages: ["TypeScript"],
      topics: [],
    },
  };
}

describe("runCvPortfolioAlignmentStep", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    alignCvWithPortfolio.mockResolvedValue({
      report: {
        summary: "Strong alignment on core frontend skills.",
        overallAlignmentScore: 82,
        supportedClaims: [
          {
            claimOrStrength: "React experience",
            category: "skills",
            assessment: "Supported by multiple repositories.",
            confidence: "high",
          },
        ],
        weaklySupportedClaims: [
          {
            claimOrStrength: "CI/CD ownership",
            category: "engineering practices",
            assessment: "Weakly evidenced by the available GitHub data.",
            confidence: "medium",
          },
        ],
        unsupportedClaims: [
          {
            claimOrStrength: "Kubernetes administration",
            category: "infrastructure",
            assessment: "Not visible in the analyzed repositories.",
            confidence: "high",
          },
        ],
        missingCvStrengths: [
          {
            claimOrStrength: "Automated testing discipline",
            category: "engineering practices",
            assessment: "GitHub suggests an additional strength worth mentioning.",
            confidence: "medium",
          },
        ],
        recommendations: [
          "Could be strengthened with a concrete project example for CI/CD work.",
        ],
        metadata: {
          provider: "AzureCvPortfolioAlignment",
          generatedAt: new Date().toISOString(),
          repositoryCount: 2,
        },
      },
      model: "gpt-test",
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips alignment when no CV exists", async () => {
    const { runCvPortfolioAlignmentStep } = await import(
      "@/lib/services/cvPortfolioAlignmentStep"
    );

    const result = await runCvPortfolioAlignmentStep(
      createReport(),
      createPortfolioEvidence(),
    );

    expect(alignCvWithPortfolio).not.toHaveBeenCalled();
    expect(result.report.cvPortfolioAlignment).toBeUndefined();
    expect(result.report.cvAlignmentStatus).toBeUndefined();
  });

  it("skips gracefully when CV extraction fails", async () => {
    const { runCvPortfolioAlignmentStep } = await import(
      "@/lib/services/cvPortfolioAlignmentStep"
    );

    const result = await runCvPortfolioAlignmentStep(
      createReport(),
      createPortfolioEvidence(),
      {
        cvUploaded: true,
        cvExtractionFailed: true,
      },
    );

    expect(alignCvWithPortfolio).not.toHaveBeenCalled();
    expect(result.status).toBe("skipped");
    expect(result.report.cvAlignmentMessage).toContain("extraction");
  });

  it("receives normalized CV evidence and GitHub portfolio evidence", async () => {
    const { runCvPortfolioAlignmentStep } = await import(
      "@/lib/services/cvPortfolioAlignmentStep"
    );
    const candidateEvidence = createCandidateEvidence();
    const portfolioEvidence = createPortfolioEvidence();

    await runCvPortfolioAlignmentStep(createReport(), portfolioEvidence, {
      cvUploaded: true,
      candidateEvidence,
      cvSource: "cv.pdf",
    });

    expect(alignCvWithPortfolio).toHaveBeenCalledWith({
      candidateEvidence,
      portfolioEvidence,
      cvSource: "cv.pdf",
    });
  });

  it("represents supported, weak, unsupported, and missing-strength findings", async () => {
    const { runCvPortfolioAlignmentStep } = await import(
      "@/lib/services/cvPortfolioAlignmentStep"
    );

    const result = await runCvPortfolioAlignmentStep(
      createReport(),
      createPortfolioEvidence(),
      {
        cvUploaded: true,
        candidateEvidence: createCandidateEvidence(),
      },
    );

    expect(result.report.cvPortfolioAlignment?.supportedClaims).toHaveLength(1);
    expect(result.report.cvPortfolioAlignment?.weaklySupportedClaims).toHaveLength(1);
    expect(result.report.cvPortfolioAlignment?.unsupportedClaims).toHaveLength(1);
    expect(result.report.cvPortfolioAlignment?.missingCvStrengths).toHaveLength(1);
    expect(result.status).toBe("completed");
  });
});
