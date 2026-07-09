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

describe("azureCvNormalizer", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    createStructuredCompletion.mockResolvedValue({
      parsed: {
        personalInformation: {
          confidence: 0.9,
          fullName: "Jane Doe",
          email: "jane@example.com",
          phone: "",
          location: "",
          websites: [],
        },
        executiveSummary: { confidence: 0.8, text: "Engineer" },
        skills: { confidence: 0.85, entries: ["React"] },
        employmentHistory: { confidence: 0.9, entries: [] },
        education: { confidence: 0.7, entries: [] },
        certifications: { confidence: 0.6, entries: [] },
        projects: { confidence: 0.65, entries: [] },
        languages: { confidence: 0.75, entries: [] },
      },
      usage: {
        promptTokens: 1200,
        completionTokens: 400,
        totalTokens: 1600,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes raw extraction into candidate evidence", async () => {
    const { normalizeCvExtraction } = await import("@/lib/azureCvNormalizer");
    const result = await normalizeCvExtraction({
      rawExtraction: {
        personalInformation: { websites: [] },
        skills: ["ReactJS"],
        employmentHistory: [],
        education: [],
        certifications: [],
        languages: [],
        projects: [],
      },
      metadata: {
        filename: "cv.pdf",
        blobName: "2026-07-09/cv.pdf",
        pagesAnalyzed: 2,
        documentModelId: "prebuilt-layout",
      },
    });

    expect(createStructuredCompletion).toHaveBeenCalled();
    expect(result.candidateEvidence.personalInformation.fullName).toBe("Jane Doe");
    expect(result.totalTokens).toBe(1600);
  });
});
