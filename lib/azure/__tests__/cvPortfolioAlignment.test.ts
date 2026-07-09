import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createStructuredCompletion = vi.fn();

vi.mock("@/lib/providers/azure/azureConfig", () => ({
  loadAzureConfig: vi.fn(() => ({
    endpoint: "https://test.services.ai.azure.com",
    apiKey: "test-key",
    deployment: "gpt-5-mini",
    apiVersion: "v1",
    usesV1Endpoint: true,
    modelCapabilities: {
      supportsTemperature: false,
      supportsTopP: false,
    },
  })),
}));

vi.mock("@/lib/providers/azure/azureCompletionClient", () => ({
  createAzureCompletionClient: vi.fn(() => ({
    createStructuredCompletion,
  })),
}));

describe("cvPortfolioAlignment", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    createStructuredCompletion.mockResolvedValue({
      parsed: {
        summary: "Overall alignment is solid.",
        overallAlignmentScore: 78,
        supportedClaims: [],
        weaklySupportedClaims: [],
        unsupportedClaims: [],
        missingCvStrengths: [],
        recommendations: [],
      },
      usage: {
        promptTokens: 900,
        completionTokens: 300,
        totalTokens: 1200,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("aligns normalized CV evidence with portfolio evidence", async () => {
    const { alignCvWithPortfolio } = await import("@/lib/cvPortfolioAlignment");

    const result = await alignCvWithPortfolio({
      candidateEvidence: {
        personalInformation: { confidence: 0.9, websites: [] },
        executiveSummary: { confidence: 0.8, text: "Engineer" },
        skills: { confidence: 0.9, entries: ["React"] },
        employmentHistory: { confidence: 0.8, entries: [] },
        education: { confidence: 0.7, entries: [] },
        certifications: { confidence: 0.6, entries: [] },
        projects: { confidence: 0.7, entries: [] },
        languages: { confidence: 0.7, entries: [] },
      },
      portfolioEvidence: {
        profile: {
          username: "dev-user",
          name: "Dev User",
          bio: null,
          avatarUrl: null,
          publicRepos: 1,
          followers: 0,
          following: 0,
          createdAt: "2021-01-01T00:00:00Z",
          url: "https://github.com/dev-user",
        },
        repositoryProfiles: [],
        aggregatedTechnologies: ["React"],
        evidenceSources: [],
        summary: {
          totalRepositories: 1,
          repositoriesWithReadme: 1,
          repositoriesWithTests: 0,
          repositoriesWithCi: 0,
          repositoriesWithDocker: 0,
          repositoriesWithDeploymentConfig: 0,
          primaryLanguages: ["TypeScript"],
          topics: [],
        },
      },
      cvSource: "cv.pdf",
    });

    expect(createStructuredCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: "cv_alignment",
      }),
    );
    expect(result.report.overallAlignmentScore).toBe(78);
    expect(result.report.metadata.cvSource).toBe("cv.pdf");
  });
});
