import type { DeveloperPortfolioReport } from "@/lib/models/report";
import { uploadCv } from "@/lib/cvUploadClient";
import type { CvAnalysisContext } from "@/types/cvAnalysisContext";
import { EMPTY_CV_ANALYSIS_CONTEXT } from "@/types/cvAnalysisContext";
import type { AnalysisProgressStepId } from "@/lib/analysis/analysisProgress";

export class AnalysisWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisWorkflowError";
  }
}

export interface RunAnalysisWorkflowInput {
  username: string;
  cvFile?: File | null;
  onStepChange?: (stepId: AnalysisProgressStepId) => void;
}

async function requestPortfolioAnalysis(
  username: string,
  cvContext: CvAnalysisContext,
): Promise<DeveloperPortfolioReport> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      candidateEvidence: cvContext.candidateEvidence,
      cvSource: cvContext.cvSource,
      cvExtractionFailed: cvContext.extractionFailed,
      cvUploaded: cvContext.cvUploaded,
    }),
  });

  const data = (await response.json()) as
    | DeveloperPortfolioReport
    | { error: string };

  if (!response.ok) {
    const errorData = data as { error: string };
    throw new AnalysisWorkflowError(errorData.error || "Analysis failed.");
  }

  return data as DeveloperPortfolioReport;
}

async function buildCvContext(cvFile: File): Promise<CvAnalysisContext> {
  try {
    const result = await uploadCv(cvFile);
    return {
      cvUploaded: true,
      candidateEvidence: result.candidateEvidence,
      cvSource: result.filename,
      extractionFailed: false,
    };
  } catch {
    return {
      cvUploaded: true,
      candidateEvidence: null,
      cvSource: cvFile.name,
      extractionFailed: true,
    };
  }
}

export async function runAnalysisWorkflow(
  input: RunAnalysisWorkflowInput,
): Promise<DeveloperPortfolioReport> {
  const { username, cvFile, onStepChange } = input;
  let cvContext: CvAnalysisContext = EMPTY_CV_ANALYSIS_CONTEXT;

  if (cvFile) {
    onStepChange?.("cv-extract");
    cvContext = await buildCvContext(cvFile);
  }

  onStepChange?.("github");

  if (cvFile) {
    onStepChange?.("cv-compare");
  }

  const report = await requestPortfolioAnalysis(username, cvContext);

  onStepChange?.(cvFile ? "generating-reports" : "generating-portfolio");

  return report;
}
