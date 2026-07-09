import { afterEach, describe, expect, it, vi } from "vitest";
import { AzureOpenAIAnalysisProvider } from "../../AzureOpenAIAnalysisProvider";
import { ProviderExecutionError } from "@/lib/errors/ProviderExecutionError";
import type { AzureCompletionClient } from "../azureCompletionClient";
import { createSampleEvidence } from "./fixtures";
import type { ExecutiveSummaryResult, LensAnalysisResult } from "../types";

const ENV_KEYS = [
  "AZURE_OPENAI_ENDPOINT",
  "AZURE_OPENAI_API_KEY",
  "AZURE_OPENAI_DEPLOYMENT",
  "AZURE_OPENAI_API_VERSION",
] as const;

const lensResult: LensAnalysisResult = {
  score: 84,
  confidence: 91,
  summary: "Strong React evidence.",
  strengths: ["React architecture is visible."],
  concerns: ["Limited CI evidence."],
  evidence: [
    {
      repository: "dev-user/app",
      path: "package.json",
      description: "Node.js package manifest",
      facts: ["dependency: react"],
    },
  ],
  recommendations: ["Add CI workflows."],
};

const executiveSummary: ExecutiveSummaryResult = {
  executiveSummary: "Solid portfolio with frontend focus.",
  careerLevel: "Mid-level",
  developerProfile: "Frontend engineer",
  overallStrengths: ["React"],
  growthOpportunities: ["CI"],
  finalRecommendations: ["Introduce GitHub Actions"],
};

function createMockClient(): AzureCompletionClient {
  return {
    async createStructuredCompletion<T>(params) {
      if (params.schemaName === "executive_summary") {
        return {
          parsed: executiveSummary as T,
          usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
        };
      }

      return {
        parsed: lensResult as T,
        usage: { promptTokens: 30, completionTokens: 15, totalTokens: 45 },
      };
    },
  };
}

describe("AzureOpenAIAnalysisProvider", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("executes lens analyses in parallel and synthesizes executive summary", async () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://example.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-4o-mini";
    process.env.AZURE_OPENAI_API_VERSION = "2024-10-21";

    const client = createMockClient();
    const createSpy = vi.spyOn(client, "createStructuredCompletion");
    const provider = new AzureOpenAIAnalysisProvider(() => client);

    const report = await provider.analyzePortfolio(createSampleEvidence());

    expect(report.sections.length).toBe(7);
    expect(report.metadata.analysisSource).toBe("azure-openai");
    expect(report.metadata.model).toBe("gpt-4o-mini");
    expect(report.metadata.totalTokens).toBeGreaterThan(0);
    expect(report.metadata.averageConfidence).toBe(91);
    expect(createSpy.mock.calls.some((call) => call[0].schemaName === "executive_summary")).toBe(
      true,
    );
  });

  it("retries only failed lens analyses before succeeding", async () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://example.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-4o-mini";
    process.env.AZURE_OPENAI_API_VERSION = "2024-10-21";

    let technicalBreadthCalls = 0;
    const client: AzureCompletionClient = {
      async createStructuredCompletion<T>(params) {
        if (params.schemaName === "executive_summary") {
          return {
            parsed: executiveSummary as T,
            usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
          };
        }

        if (params.schemaName === "lens_analysis_technical-breadth") {
          technicalBreadthCalls += 1;
          if (technicalBreadthCalls === 1) {
            throw new Error("lens failed");
          }
        }

        return {
          parsed: lensResult as T,
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        };
      },
    };

    const provider = new AzureOpenAIAnalysisProvider(() => client);
    const report = await provider.analyzePortfolio(createSampleEvidence());

    expect(report.sections.length).toBe(7);
    expect(technicalBreadthCalls).toBe(2);
  });

  it("throws ProviderExecutionError when lens retries are exhausted", async () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://example.openai.azure.com";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-4o-mini";
    process.env.AZURE_OPENAI_API_VERSION = "2024-10-21";

    const client: AzureCompletionClient = {
      async createStructuredCompletion<T>() {
        throw new Error("lens failed");
      },
    };

    const provider = new AzureOpenAIAnalysisProvider(() => client);
    await expect(provider.analyzePortfolio(createSampleEvidence())).rejects.toBeInstanceOf(
      ProviderExecutionError,
    );
  });
});
