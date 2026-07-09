import type { AnalyzeResult } from "@azure/ai-form-recognizer";
import {
  AzureKeyCredential,
  DocumentAnalysisClient,
} from "@azure/ai-form-recognizer";
import { mapAzureResumeToCandidateCv } from "@/lib/azure/cvMapper";
import { loadDocumentIntelligenceConfig } from "@/lib/azure/documentIntelligenceConfig";
import {
  DocumentAnalysisError,
  DocumentConfigurationError,
} from "@/lib/azure/documentIntelligenceErrors";
import { logDocumentIntelligenceEvent } from "@/lib/azure/documentIntelligenceLogger";
import type { CandidateCv } from "@/lib/models/candidateCv";

export const PREBUILT_RESUME_MODEL_ID = "prebuilt-resume";

export interface CvAnalysisResult {
  candidateCv: CandidateCv;
  pagesAnalyzed: number;
}

let documentAnalysisClient: DocumentAnalysisClient | null = null;

function getDocumentAnalysisClient(): DocumentAnalysisClient {
  try {
    const config = loadDocumentIntelligenceConfig();

    if (!documentAnalysisClient) {
      documentAnalysisClient = new DocumentAnalysisClient(
        config.endpoint,
        new AzureKeyCredential(config.key),
      );
    }

    return documentAnalysisClient;
  } catch (error) {
    if (error instanceof DocumentConfigurationError) {
      throw error;
    }

    throw new DocumentConfigurationError(
      "Azure Document Intelligence is not configured correctly.",
    );
  }
}

async function runResumeAnalysis(
  startAnalysis: () => Promise<{
    pollUntilDone: () => Promise<AnalyzeResult>;
  }>,
  options: { blobName?: string },
): Promise<CvAnalysisResult> {
  const startedAt = Date.now();

  logDocumentIntelligenceEvent({
    event: "document_analysis_started",
    blobName: options.blobName,
  });

  try {
    const poller = await startAnalysis();
    const analysisResult = await poller.pollUntilDone();
    const candidateCv = mapAzureResumeToCandidateCv(analysisResult);
    const pagesAnalyzed = analysisResult.pages?.length ?? 0;
    const durationMs = Date.now() - startedAt;

    logDocumentIntelligenceEvent({
      event: "document_analysis_completed",
      blobName: options.blobName,
      pagesAnalyzed,
      durationMs,
    });

    return {
      candidateCv,
      pagesAnalyzed,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message =
      error instanceof DocumentConfigurationError ||
      error instanceof DocumentAnalysisError
        ? error.message
        : "CV document analysis failed.";

    logDocumentIntelligenceEvent({
      event: "document_analysis_failed",
      blobName: options.blobName,
      durationMs,
      error: message,
    });

    if (error instanceof DocumentConfigurationError) {
      throw error;
    }

    throw new DocumentAnalysisError(message, { cause: error });
  }
}

export async function analyzeCv(
  buffer: Buffer,
  options: { blobName?: string } = {},
): Promise<CvAnalysisResult> {
  const client = getDocumentAnalysisClient();

  return runResumeAnalysis(
    () => client.beginAnalyzeDocument(PREBUILT_RESUME_MODEL_ID, buffer),
    options,
  );
}

export async function analyzeCvFromBlob(
  blobUrl: string,
  options: { blobName?: string } = {},
): Promise<CvAnalysisResult> {
  const client = getDocumentAnalysisClient();

  return runResumeAnalysis(
    () => client.beginAnalyzeDocumentFromUrl(PREBUILT_RESUME_MODEL_ID, blobUrl),
    options,
  );
}

export function resetDocumentIntelligenceClientForTests(): void {
  documentAnalysisClient = null;
}
