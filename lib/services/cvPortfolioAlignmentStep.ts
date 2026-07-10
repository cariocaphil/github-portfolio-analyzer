import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";
import type { CvAlignmentStatus } from "@/domain/cvPortfolioAlignment";
import { logCvAlignmentEvent } from "@/lib/azure/cvAlignmentLogger";
import { alignCvWithPortfolio } from "@/lib/cvPortfolioAlignment";
import type { UnifiedPortfolioEvidenceModel } from "@/lib/models/portfolio";
import type { DeveloperPortfolioReport } from "@/lib/models/report";

export interface CvAlignmentInput {
  candidateEvidence?: CandidateEvidenceModel | null;
  cvSource?: string;
  cvExtractionFailed?: boolean;
  cvUploaded?: boolean;
}

export interface CvAlignmentStepResult {
  report: DeveloperPortfolioReport;
  status?: CvAlignmentStatus;
  message?: string;
}

export async function runCvPortfolioAlignmentStep(
  report: DeveloperPortfolioReport,
  portfolioEvidence: UnifiedPortfolioEvidenceModel,
  input?: CvAlignmentInput,
): Promise<CvAlignmentStepResult> {
  const repositoryCount = portfolioEvidence.repositoryProfiles.length;

  if (!input?.cvUploaded) {
    logCvAlignmentEvent({
      event: "cv_alignment_skipped",
      repositoryCount,
      hasCvEvidence: false,
      reason: "no_cv_uploaded",
    });

    return { report };
  }

  if (input.cvExtractionFailed) {
    const message =
      "CV alignment was skipped because CV extraction did not complete successfully.";

    logCvAlignmentEvent({
      event: "cv_alignment_skipped",
      repositoryCount,
      hasCvEvidence: false,
      reason: "cv_extraction_failed",
    });

    return {
      report: {
        ...report,
        cvAlignmentStatus: "skipped",
        cvAlignmentMessage: message,
      },
      status: "skipped",
      message,
    };
  }

  if (!input.candidateEvidence) {
    const message =
      "CV alignment was skipped because normalized CV evidence is unavailable.";

    logCvAlignmentEvent({
      event: "cv_alignment_skipped",
      repositoryCount,
      hasCvEvidence: false,
      reason: "missing_candidate_evidence",
    });

    return {
      report: {
        ...report,
        cvAlignmentStatus: "skipped",
        cvAlignmentMessage: message,
      },
      status: "skipped",
      message,
    };
  }

  try {
    const alignment = await alignCvWithPortfolio({
      candidateEvidence: input.candidateEvidence,
      portfolioEvidence,
      cvSource: input.cvSource,
    });

    return {
      report: {
        ...report,
        cvPortfolioAlignment: alignment.report,
        cvAlignmentStatus: "completed",
      },
      status: "completed",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? `CV alignment could not be completed: ${error.message}`
        : "CV alignment could not be completed.";

    return {
      report: {
        ...report,
        cvAlignmentStatus: "failed",
        cvAlignmentMessage: message,
      },
      status: "failed",
      message,
    };
  }
}
