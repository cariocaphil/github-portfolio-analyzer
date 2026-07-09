import type { CandidateCv } from "@/lib/models/candidateCv";
import type { CvExtractionSummary } from "@/lib/cv/buildCvExtractionSummary";

export type CvUploadSuccess = {
  success: true;
  blobName: string;
  url: string;
  filename: string;
  size: number;
  cv: CvExtractionSummary;
  extractedCv: CandidateCv;
};

export type CvUploadError = {
  success: false;
  stage?: string;
  error: string;
  blobName?: string;
  url?: string;
  filename?: string;
  size?: number;
};

export type CvUploadResponse = CvUploadSuccess | CvUploadError;
