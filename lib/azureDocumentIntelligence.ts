import type { AnalyzeResult } from "@azure/ai-form-recognizer";
import {
  AzureKeyCredential,
  DocumentAnalysisClient,
} from "@azure/ai-form-recognizer";
import { mapAzureAnalysisToCandidateCv } from "@/lib/azure/cvMapper";
import { loadDocumentIntelligenceConfig } from "@/lib/azure/documentIntelligenceConfig";
import {
  extractDocumentIntelligenceFailure,
  toPublicDocumentAnalysisMessage,
} from "@/lib/azure/documentIntelligenceDiagnostics";
import {
  DocumentAnalysisError,
  DocumentAuthenticationError,
  DocumentConfigurationError,
} from "@/lib/azure/documentIntelligenceErrors";
import { logDocumentIntelligenceEvent } from "@/lib/azure/documentIntelligenceLogger";
import type { CandidateCv } from "@/lib/models/candidateCv";

export { DEFAULT_DOCUMENT_INTELLIGENCE_MODEL_ID } from "@/lib/azure/documentIntelligenceConfig";

export interface CvAnalysisResult {
  candidateCv: CandidateCv;
  pagesAnalyzed: number;
  modelId: string;
}

let documentAnalysisClient: DocumentAnalysisClient | null = null;
let configuredModelId: string | null = null;

function getDocumentAnalysisClient(): {
  client: DocumentAnalysisClient;
  modelId: string;
} {
  try {
    const config = loadDocumentIntelligenceConfig();

    if (!documentAnalysisClient || configuredModelId !== config.modelId) {
      documentAnalysisClient = new DocumentAnalysisClient(
        config.endpoint,
        new AzureKeyCredential(config.key),
      );
      configuredModelId = config.modelId;
    }

    return {
      client: documentAnalysisClient,
      modelId: config.modelId,
    };
  } catch (error) {
    if (error instanceof DocumentConfigurationError) {
      throw error;
    }

    throw new DocumentConfigurationError(
      "Azure Document Intelligence is not configured correctly.",
    );
  }
}

function mapDocumentIntelligenceError(error: unknown): never {
  const details = extractDocumentIntelligenceFailure(error);
  const publicMessage = toPublicDocumentAnalysisMessage(details);

  if (details.statusCode === 401 || details.statusCode === 403) {
    throw new DocumentAuthenticationError(
      publicMessage,
      details.statusCode,
      { cause: error },
    );
  }

  throw new DocumentAnalysisError(publicMessage, {
    cause: error,
    statusCode: details.statusCode,
    azureErrorCode: details.azureErrorCode,
    requestId: details.requestId,
  });
}

async function runResumeAnalysis(
  startAnalysis: () => Promise<{
    pollUntilDone: () => Promise<AnalyzeResult>;
  }>,
  options: { blobName?: string; modelId: string },
): Promise<CvAnalysisResult> {
  const startedAt = Date.now();

  logDocumentIntelligenceEvent({
    event: "document_analysis_started",
    blobName: options.blobName,
    model: options.modelId,
  });

  try {
    const poller = await startAnalysis();
    const analysisResult = await poller.pollUntilDone();
    const candidateCv = mapAzureAnalysisToCandidateCv(analysisResult);
    const pagesAnalyzed = analysisResult.pages?.length ?? 0;
    const durationMs = Date.now() - startedAt;

    logDocumentIntelligenceEvent({
      event: "document_analysis_completed",
      blobName: options.blobName,
      model: options.modelId,
      pagesAnalyzed,
      durationMs,
    });

    return {
      candidateCv,
      pagesAnalyzed,
      modelId: options.modelId,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const details = extractDocumentIntelligenceFailure(error);

    logDocumentIntelligenceEvent({
      event: "document_analysis_failed",
      blobName: options.blobName,
      model: options.modelId,
      durationMs,
      error: details.message,
      azureErrorCode: details.azureErrorCode,
      azureErrorMessage: details.azureErrorMessage,
      statusCode: details.statusCode,
      requestId: details.requestId,
      stack: details.stack,
    });

    if (
      error instanceof DocumentConfigurationError ||
      error instanceof DocumentAuthenticationError ||
      error instanceof DocumentAnalysisError
    ) {
      throw error;
    }

    mapDocumentIntelligenceError(error);
  }
}

export async function analyzeCv(
  buffer: Buffer,
  options: { blobName?: string } = {},
): Promise<CvAnalysisResult> {
  const { client, modelId } = getDocumentAnalysisClient();

  return runResumeAnalysis(
    () => client.beginAnalyzeDocument(modelId, buffer),
    { ...options, modelId },
  );
}

export async function analyzeCvFromBlob(
  blobUrl: string,
  options: { blobName?: string } = {},
): Promise<CvAnalysisResult> {
  const { client, modelId } = getDocumentAnalysisClient();

  return runResumeAnalysis(
    () => client.beginAnalyzeDocumentFromUrl(modelId, blobUrl),
    { ...options, modelId },
  );
}

export function resetDocumentIntelligenceClientForTests(): void {
  documentAnalysisClient = null;
  configuredModelId = null;
}
