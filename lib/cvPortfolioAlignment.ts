import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";
import type { CvPortfolioAlignmentReport } from "@/domain/cvPortfolioAlignment";
import { CvAlignmentError } from "@/lib/azure/cvAlignmentErrors";
import { logCvAlignmentEvent } from "@/lib/azure/cvAlignmentLogger";
import { mapCvAlignmentResponseToReport } from "@/lib/azure/cvAlignmentMapper";
import {
  buildCvAlignmentUserPrompt,
  CV_ALIGNMENT_SYSTEM_PROMPT,
  type CvAlignmentPromptMetadata,
} from "@/lib/azure/cvAlignmentPrompts";
import {
  CV_ALIGNMENT_JSON_SCHEMA,
  type CvAlignmentModelResponse,
} from "@/lib/azure/cvAlignmentSchema";
import type { UnifiedPortfolioEvidenceModel } from "@/lib/models/portfolio";
import { loadAzureConfig } from "@/lib/providers/azure/azureConfig";
import { createAzureCompletionClient } from "@/lib/providers/azure/azureCompletionClient";
import {
  buildPortfolioContextCache,
  buildPortfolioSummaryMarkdown,
} from "@/lib/providers/azure/portfolioContextBuilder";

const PROVIDER_NAME = "AzureCvPortfolioAlignment";

export interface CvPortfolioAlignmentInput {
  candidateEvidence: CandidateEvidenceModel;
  portfolioEvidence: UnifiedPortfolioEvidenceModel;
  cvSource?: string;
}

export interface CvPortfolioAlignmentResult {
  report: CvPortfolioAlignmentReport;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

function buildPortfolioEvidenceMarkdown(
  evidence: UnifiedPortfolioEvidenceModel,
): string {
  const cache = buildPortfolioContextCache(evidence);
  const repositorySections = [...cache.values()].map(
    (context) => context.markdown,
  );

  return [
    buildPortfolioSummaryMarkdown(evidence),
    "",
    "# Repository Evidence Profiles",
    "",
    repositorySections.join("\n\n---\n\n"),
  ].join("\n");
}

export async function alignCvWithPortfolio(
  input: CvPortfolioAlignmentInput,
): Promise<CvPortfolioAlignmentResult> {
  const startedAt = Date.now();
  let config;

  try {
    config = loadAzureConfig();
  } catch (error) {
    throw new CvAlignmentError(
      "Azure OpenAI is not configured for CV portfolio alignment.",
      { cause: error, statusCode: 503 },
    );
  }

  const metadata: CvAlignmentPromptMetadata = {
    githubUsername: input.portfolioEvidence.profile.username,
    repositoryCount: input.portfolioEvidence.repositoryProfiles.length,
    cvSource: input.cvSource,
  };

  logCvAlignmentEvent({
    event: "cv_alignment_started",
    repositoryCount: metadata.repositoryCount,
    hasCvEvidence: true,
    provider: PROVIDER_NAME,
    model: config.deployment,
  });

  try {
    const client = createAzureCompletionClient(config);
    const completion =
      await client.createStructuredCompletion<CvAlignmentModelResponse>({
        schemaName: "cv_portfolio_alignment_report",
        schema: CV_ALIGNMENT_JSON_SCHEMA,
        systemPrompt: CV_ALIGNMENT_SYSTEM_PROMPT,
        userPrompt: buildCvAlignmentUserPrompt(
          input.candidateEvidence,
          buildPortfolioEvidenceMarkdown(input.portfolioEvidence),
          metadata,
        ),
        requestType: "cv_alignment",
      });

    const report = mapCvAlignmentResponseToReport(completion.parsed, {
      provider: PROVIDER_NAME,
      model: config.deployment,
      generatedAt: new Date().toISOString(),
      cvSource: input.cvSource,
      repositoryCount: metadata.repositoryCount,
    });

    const durationMs = Date.now() - startedAt;

    logCvAlignmentEvent({
      event: "cv_alignment_completed",
      repositoryCount: metadata.repositoryCount,
      hasCvEvidence: true,
      provider: PROVIDER_NAME,
      model: config.deployment,
      durationMs,
      promptTokens: completion.usage.promptTokens,
      completionTokens: completion.usage.completionTokens,
      totalTokens: completion.usage.totalTokens,
    });

    return {
      report,
      model: config.deployment,
      promptTokens: completion.usage.promptTokens,
      completionTokens: completion.usage.completionTokens,
      totalTokens: completion.usage.totalTokens,
    };
  } catch (error) {
    logCvAlignmentEvent({
      event: "cv_alignment_failed",
      repositoryCount: metadata.repositoryCount,
      hasCvEvidence: true,
      provider: PROVIDER_NAME,
      model: config.deployment,
      error: error instanceof Error ? error.message : "Unknown alignment error",
    });

    if (error instanceof CvAlignmentError) {
      throw error;
    }

    throw new CvAlignmentError("CV portfolio alignment failed.", {
      cause: error,
    });
  }
}
