import type { DeveloperPortfolioReport } from "@/lib/models/report";
import type { AlignmentFinding } from "@/domain/cvPortfolioAlignment";

export function shouldShowCvAlignmentSection(
  report: DeveloperPortfolioReport,
): boolean {
  return Boolean(report.cvPortfolioAlignment);
}

export function shouldShowCvAlignmentSkipMessage(
  report: DeveloperPortfolioReport,
): boolean {
  return (
    report.cvAlignmentStatus === "skipped" ||
    report.cvAlignmentStatus === "failed"
  );
}

export function getCvAlignmentSkipMessage(
  report: DeveloperPortfolioReport,
): string | null {
  if (!shouldShowCvAlignmentSkipMessage(report)) {
    return null;
  }

  return (
    report.cvAlignmentMessage ??
    "CV alignment was skipped for this analysis."
  );
}

export function getCvAlignmentNavigationLabel(): string {
  return "CV ↔ GitHub Alignment";
}

export function formatAlignmentFindings(
  findings: AlignmentFinding[],
  limit = 5,
): AlignmentFinding[] {
  return findings.slice(0, limit);
}
