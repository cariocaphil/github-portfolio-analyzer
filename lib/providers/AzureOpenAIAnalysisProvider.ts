import { getPortfolioLenses } from "@/config/analysisLenses";
import { ProviderExecutionError } from "@/lib/errors/ProviderExecutionError";
import type { UnifiedPortfolioEvidenceModel } from "@/lib/models/portfolio";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import type { AnalysisLens } from "@/lib/models/report";
import type { PortfolioAnalysisProvider } from "./PortfolioAnalysisProvider";
import {
  createAzureCompletionClient,
  type AzureCompletionClient,
} from "./azure/azureCompletionClient";
import { loadAzureConfig } from "./azure/azureConfig";
import { aggregateConfidence } from "./azure/confidence";
import { buildLensContextMarkdown } from "./azure/lensContextMapper";
import { logAnalysisEvent } from "./azure/logger";
import {
  buildPortfolioSummaryMarkdown,
} from "./azure/portfolioContextBuilder";
import {
  buildExecutiveSummaryUserPrompt,
  buildLensUserPrompt,
} from "./azure/prompts";
import { withRetry } from "./azure/retry";
import {
  formatLensAnalysesForExecutiveSummary,
  mapToDeveloperPortfolioReport,
} from "./azure/reportMapper";
import {
  EXECUTIVE_SUMMARY_JSON_SCHEMA,
  LENS_ANALYSIS_JSON_SCHEMA,
} from "./azure/schemas";
import type {
  ExecutiveSummaryResult,
  LensAnalysisResult,
  RequestTokenUsage,
  TokenUsageTotals,
} from "./azure/types";

const PROVIDER_NAME = "AzureOpenAIAnalysisProvider";
const PROVIDER_VERSION = "1.0.0";
const MAX_LENS_FAILURE_PASSES = 3;

export class AzureOpenAIAnalysisProvider implements PortfolioAnalysisProvider {
  constructor(
    private readonly clientFactory?: () => AzureCompletionClient,
  ) {}

  async analyzePortfolio(
    evidence: UnifiedPortfolioEvidenceModel,
  ): Promise<DeveloperPortfolioReport> {
    const config = loadAzureConfig();
    const client = this.clientFactory?.() ?? createAzureCompletionClient(config);
    const startedAt = Date.now();
    const lenses = getPortfolioLenses();
    const portfolioSummary = buildPortfolioSummaryMarkdown(evidence);
    const tokenUsage: TokenUsageTotals = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    const requestTokenUsage: RequestTokenUsage[] = [];

    logAnalysisEvent({
      event: "portfolio_analysis_started",
      provider: PROVIDER_NAME,
      model: config.deployment,
      repositoryCount: evidence.repositoryProfiles.length,
      lensCount: lenses.length,
    });

    const lensResults = await this.runLensAnalyses({
      client,
      evidence,
      lenses,
      portfolioSummary,
      tokenUsage,
      requestTokenUsage,
    });

    const executiveSummary = await withRetry(
      () =>
        this.analyzeExecutiveSummary({
          client,
          portfolioSummary,
          lensResults,
          tokenUsage,
          requestTokenUsage,
        }),
      {
        maxRetries: 3,
        onRetry: (attempt) => {
          logAnalysisEvent({
            event: "executive_summary_retry",
            provider: PROVIDER_NAME,
            model: config.deployment,
            retryAttempt: attempt,
          });
        },
      },
    );

    const reportBody = mapToDeveloperPortfolioReport({
      evidence,
      lensResults,
      executiveSummary,
    });

    const confidenceValues = lensResults.map(({ result }) => result.confidence);
    const confidence = aggregateConfidence(confidenceValues);
    const analysisDurationMs = Date.now() - startedAt;

    logAnalysisEvent({
      event: "portfolio_analysis_completed",
      provider: PROVIDER_NAME,
      model: config.deployment,
      repositoryCount: evidence.repositoryProfiles.length,
      lensCount: lenses.length,
      analysisDurationMs,
      promptTokens: tokenUsage.promptTokens,
      completionTokens: tokenUsage.completionTokens,
      totalTokens: tokenUsage.totalTokens,
    });

    return {
      ...reportBody,
      metadata: {
        analysisSource: "azure-openai",
        generationTimestamp: new Date().toISOString(),
        providerName: PROVIDER_NAME,
        providerVersion: PROVIDER_VERSION,
        provider: "azure-openai",
        model: config.deployment,
        analysisDurationMs,
        promptTokens: tokenUsage.promptTokens,
        completionTokens: tokenUsage.completionTokens,
        totalTokens: tokenUsage.totalTokens,
        aggregatedTechnologies: evidence.aggregatedTechnologies,
        requestTokenUsage,
        averageConfidence: confidence.averageConfidence,
        highestConfidence: confidence.highestConfidence,
        lowestConfidence: confidence.lowestConfidence,
      },
    };
  }

  private async runLensAnalyses(params: {
    client: AzureCompletionClient;
    evidence: UnifiedPortfolioEvidenceModel;
    lenses: AnalysisLens[];
    portfolioSummary: string;
    tokenUsage: TokenUsageTotals;
    requestTokenUsage: RequestTokenUsage[];
  }): Promise<Array<{ lens: AnalysisLens; result: LensAnalysisResult }>> {
    const completed = new Map<string, LensAnalysisResult>();
    let remaining = [...params.lenses];
    let pass = 0;

    while (remaining.length > 0) {
      pass += 1;
      const outputs = await Promise.all(
        remaining.map(async (lens) => {
          try {
            const result = await withRetry(
              () =>
                this.analyzeLens({
                  client: params.client,
                  lens,
                  evidence: params.evidence,
                  portfolioSummary: params.portfolioSummary,
                  tokenUsage: params.tokenUsage,
                  requestTokenUsage: params.requestTokenUsage,
                }),
              {
                maxRetries: 3,
                onRetry: (attempt) => {
                  logAnalysisEvent({
                    event: "lens_analysis_retry",
                    provider: PROVIDER_NAME,
                    retryAttempt: attempt,
                    lensCount: 1,
                  });
                },
              },
            );
            return { lens, result, failed: false as const };
          } catch (error) {
            return { lens, error, failed: true as const };
          }
        }),
      );

      const failedLenses: AnalysisLens[] = [];
      for (const output of outputs) {
        if (!output.failed) {
          completed.set(output.lens.id, output.result);
        } else {
          failedLenses.push(output.lens);
        }
      }

      if (failedLenses.length === 0) {
        break;
      }

      if (pass >= MAX_LENS_FAILURE_PASSES) {
        throw new ProviderExecutionError(
          `Azure OpenAI lens analysis failed for: ${failedLenses.map((lens) => lens.id).join(", ")}.`,
          PROVIDER_NAME,
          outputs.find((output) => output.failed)?.error,
        );
      }

      remaining = failedLenses;
    }

    return params.lenses.map((lens) => ({
      lens,
      result: completed.get(lens.id)!,
    }));
  }

  private async analyzeLens(params: {
    client: AzureCompletionClient;
    lens: AnalysisLens;
    evidence: UnifiedPortfolioEvidenceModel;
    portfolioSummary: string;
    tokenUsage: TokenUsageTotals;
    requestTokenUsage: RequestTokenUsage[];
  }): Promise<LensAnalysisResult> {
    const lensContext = buildLensContextMarkdown({
      lens: params.lens,
      evidence: params.evidence,
    });

    const completion = await params.client.createStructuredCompletion<LensAnalysisResult>(
      {
        schemaName: `lens_analysis_${params.lens.id}`,
        schema: LENS_ANALYSIS_JSON_SCHEMA,
        lensId: params.lens.id,
        requestType: "lens_analysis",
        userPrompt: buildLensUserPrompt({
          lensTitle: params.lens.title,
          guidingQuestion: params.lens.guidingQuestion,
          promptInstructions: params.lens.promptInstructions,
          portfolioSummary: params.portfolioSummary,
          lensContext,
        }),
      },
    );

    params.tokenUsage.promptTokens += completion.usage.promptTokens;
    params.tokenUsage.completionTokens += completion.usage.completionTokens;
    params.tokenUsage.totalTokens += completion.usage.totalTokens;
    params.requestTokenUsage.push({
      requestType: "lens_analysis",
      lensId: params.lens.id,
      schemaName: `lens_analysis_${params.lens.id}`,
      promptTokens: completion.usage.promptTokens,
      completionTokens: completion.usage.completionTokens,
      totalTokens: completion.usage.totalTokens,
    });

    return completion.parsed;
  }

  private async analyzeExecutiveSummary(params: {
    client: AzureCompletionClient;
    portfolioSummary: string;
    lensResults: Array<{ lens: AnalysisLens; result: LensAnalysisResult }>;
    tokenUsage: TokenUsageTotals;
    requestTokenUsage: RequestTokenUsage[];
  }): Promise<ExecutiveSummaryResult> {
    const completion =
      await params.client.createStructuredCompletion<ExecutiveSummaryResult>({
        schemaName: "executive_summary",
        schema: EXECUTIVE_SUMMARY_JSON_SCHEMA,
        requestType: "executive_summary",
        userPrompt: buildExecutiveSummaryUserPrompt({
          portfolioSummary: params.portfolioSummary,
          lensAnalyses: formatLensAnalysesForExecutiveSummary(params.lensResults),
        }),
      });

    params.tokenUsage.promptTokens += completion.usage.promptTokens;
    params.tokenUsage.completionTokens += completion.usage.completionTokens;
    params.tokenUsage.totalTokens += completion.usage.totalTokens;
    params.requestTokenUsage.push({
      requestType: "executive_summary",
      schemaName: "executive_summary",
      promptTokens: completion.usage.promptTokens,
      completionTokens: completion.usage.completionTokens,
      totalTokens: completion.usage.totalTokens,
    });

    return completion.parsed;
  }
}
