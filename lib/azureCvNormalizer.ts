import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";
import { CvNormalizationError } from "@/lib/azure/cvNormalizerErrors";
import { logCvNormalizationEvent } from "@/lib/azure/cvNormalizerLogger";
import { mapCvNormalizationResponseToCandidateEvidence } from "@/lib/azure/cvNormalizerMapper";
import {
  buildCvNormalizationUserPrompt,
  CV_NORMALIZATION_SYSTEM_PROMPT,
  type CvNormalizationPromptMetadata,
} from "@/lib/azure/cvNormalizerPrompts";
import {
  CV_NORMALIZATION_JSON_SCHEMA,
  type CvNormalizationModelResponse,
} from "@/lib/azure/cvNormalizerSchema";
import type { CandidateCv } from "@/lib/models/candidateCv";
import { loadAzureConfig } from "@/lib/providers/azure/azureConfig";
import { createAzureCompletionClient } from "@/lib/providers/azure/azureCompletionClient";

export interface CvNormalizationInput {
  rawExtraction: CandidateCv;
  metadata: CvNormalizationPromptMetadata;
}

export interface CvNormalizationResult {
  candidateEvidence: CandidateEvidenceModel;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export async function normalizeCvExtraction(
  input: CvNormalizationInput,
): Promise<CvNormalizationResult> {
  const startedAt = Date.now();
  let config;

  try {
    config = loadAzureConfig();
  } catch (error) {
    throw new CvNormalizationError(
      "Azure OpenAI is not configured for CV normalization.",
      { cause: error, statusCode: 503 },
    );
  }

  logCvNormalizationEvent({
    event: "cv_normalization_started",
    model: config.deployment,
    blobName: input.metadata.blobName,
  });

  try {
    const client = createAzureCompletionClient(config);
    const completion = await client.createStructuredCompletion<CvNormalizationModelResponse>(
      {
        schemaName: "candidate_evidence_model",
        schema: CV_NORMALIZATION_JSON_SCHEMA,
        systemPrompt: CV_NORMALIZATION_SYSTEM_PROMPT,
        userPrompt: buildCvNormalizationUserPrompt(
          input.rawExtraction,
          input.metadata,
        ),
        requestType: "cv_normalization",
      },
    );

    const candidateEvidence = mapCvNormalizationResponseToCandidateEvidence(
      completion.parsed,
    );
    const durationMs = Date.now() - startedAt;

    logCvNormalizationEvent({
      event: "cv_normalization_completed",
      model: config.deployment,
      blobName: input.metadata.blobName,
      durationMs,
      promptTokens: completion.usage.promptTokens,
      completionTokens: completion.usage.completionTokens,
      totalTokens: completion.usage.totalTokens,
    });

    return {
      candidateEvidence,
      model: config.deployment,
      promptTokens: completion.usage.promptTokens,
      completionTokens: completion.usage.completionTokens,
      totalTokens: completion.usage.totalTokens,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message =
      error instanceof CvNormalizationError
        ? error.message
        : "Azure OpenAI could not normalize the extracted CV.";

    logCvNormalizationEvent({
      event: "cv_normalization_failed",
      model: config.deployment,
      blobName: input.metadata.blobName,
      durationMs,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof CvNormalizationError) {
      throw error;
    }

    throw new CvNormalizationError(message, { cause: error });
  }
}
