export type AlignmentConfidence = "high" | "medium" | "low";

export interface AlignmentFinding {
  claimOrStrength: string;
  category: string;
  cvEvidence?: string;
  githubEvidence?: string[];
  assessment: string;
  confidence: AlignmentConfidence;
}

export interface CvPortfolioAlignmentMetadata {
  provider: string;
  model?: string;
  generatedAt: string;
  cvSource?: string;
  repositoryCount: number;
}

export interface CvPortfolioAlignmentReport {
  summary: string;
  overallAlignmentScore: number;
  supportedClaims: AlignmentFinding[];
  weaklySupportedClaims: AlignmentFinding[];
  unsupportedClaims: AlignmentFinding[];
  missingCvStrengths: AlignmentFinding[];
  recommendations: string[];
  metadata: CvPortfolioAlignmentMetadata;
}

export type CvAlignmentStatus = "completed" | "skipped" | "failed";
