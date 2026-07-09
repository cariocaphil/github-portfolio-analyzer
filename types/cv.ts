import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";
import type { CandidateCv } from "@/lib/models/candidateCv";
import type { CvExtractionSummary } from "@/lib/cv/buildCvExtractionSummary";

export type CvUploadSuccess = {
  success: true;
  blobName: string;
  url: string;
  filename: string;
  size: number;
  cv: CvExtractionSummary;
  rawExtraction: CandidateCv;
  candidateEvidence: CandidateEvidenceModel | null;
  normalizationError?: string;
};

export type CvUploadError = {
  success: false;
  stage?: string;
  error: string;
  blobName?: string;
  url?: string;
  filename?: string;
  size?: number;
  rawExtraction?: CandidateCv;
};

export type CvUploadResponse = CvUploadSuccess | CvUploadError;
