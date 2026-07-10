import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";

export interface CvAnalysisContext {
  cvUploaded: boolean;
  candidateEvidence: CandidateEvidenceModel | null;
  cvSource?: string;
  extractionFailed: boolean;
}

export const EMPTY_CV_ANALYSIS_CONTEXT: CvAnalysisContext = {
  cvUploaded: false,
  candidateEvidence: null,
  extractionFailed: false,
};
