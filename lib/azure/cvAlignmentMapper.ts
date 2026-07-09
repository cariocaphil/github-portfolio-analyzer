import type {
  AlignmentFinding,
  CvPortfolioAlignmentReport,
} from "@/domain/cvPortfolioAlignment";
import type { CvAlignmentModelResponse } from "@/lib/azure/cvAlignmentSchema";

function mapFinding(
  finding: CvAlignmentModelResponse["supportedClaims"][number],
): AlignmentFinding {
  return {
    claimOrStrength: finding.claimOrStrength.trim(),
    category: finding.category.trim(),
    cvEvidence: optionalString(finding.cvEvidence),
    githubEvidence: finding.githubEvidence
      .map((item) => item.trim())
      .filter(Boolean),
    assessment: finding.assessment.trim(),
    confidence: finding.confidence,
  };
}

function optionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function mapCvAlignmentResponseToReport(
  response: CvAlignmentModelResponse,
  metadata: CvPortfolioAlignmentReport["metadata"],
): CvPortfolioAlignmentReport {
  return {
    summary: response.summary.trim(),
    overallAlignmentScore: clampScore(response.overallAlignmentScore),
    supportedClaims: response.supportedClaims.map(mapFinding),
    weaklySupportedClaims: response.weaklySupportedClaims.map(mapFinding),
    unsupportedClaims: response.unsupportedClaims.map(mapFinding),
    missingCvStrengths: response.missingCvStrengths.map(mapFinding),
    recommendations: response.recommendations
      .map((item) => item.trim())
      .filter(Boolean),
    metadata,
  };
}
