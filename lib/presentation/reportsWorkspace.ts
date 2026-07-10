import type { DeveloperPortfolioReport } from "@/lib/models/report";
import { shouldShowCvAlignmentSection } from "@/lib/presentation/cvPortfolioAlignmentPresentation";
import { slugFromLensId } from "@/lib/presentation/reportPresentation";

export const PORTFOLIO_ASSESSMENT_REPORT_ID = "engineering-portfolio-assessment";
export const CV_ALIGNMENT_REPORT_ID = "cv-github-alignment";

export interface ReportSourceBadge {
  label: string;
}

export interface WorkspaceReportSection {
  id: string;
  label: string;
}

export interface WorkspaceReportHeader {
  title: string;
  sources: ReportSourceBadge[];
  generatedAt: string;
  repositoryCount?: number;
  alignmentScore?: number;
  developerLabel?: string;
}

export interface WorkspaceReportModel {
  id: string;
  title: string;
  defaultExpanded: boolean;
  header: WorkspaceReportHeader;
  sections: WorkspaceReportSection[];
  isPrimary?: boolean;
}

export interface ReportsWorkspaceModel {
  reports: WorkspaceReportModel[];
  skipNotice?: string | null;
}

export function formatReportTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function buildPortfolioAssessmentReport(
  report: DeveloperPortfolioReport,
): WorkspaceReportModel {
  const developerLabel = report.developerSnapshot.name
    ? `${report.developerSnapshot.name} (@${report.developerSnapshot.username})`
    : `@${report.developerSnapshot.username}`;

  return {
    id: PORTFOLIO_ASSESSMENT_REPORT_ID,
    title: "Engineering Portfolio Assessment",
    defaultExpanded: true,
    isPrimary: true,
    header: {
      title: "Engineering Portfolio Assessment",
      sources: [{ label: "GitHub Portfolio" }],
      generatedAt: report.metadata.generationTimestamp,
      repositoryCount: report.developerSnapshot.totalRepositories,
      developerLabel,
    },
    sections: [
      { id: "portfolio-executive-summary", label: "Executive Summary" },
      { id: "portfolio-technology-breakdown", label: "Technology Breakdown" },
      ...report.sections.map((section) => ({
        id: `portfolio-${slugFromLensId(section.lensId)}`,
        label: section.title,
      })),
      { id: "portfolio-improvement-suggestions", label: "Improvement Suggestions" },
    ],
  };
}

export function buildCvAlignmentReport(
  report: DeveloperPortfolioReport,
): WorkspaceReportModel | null {
  if (!shouldShowCvAlignmentSection(report) || !report.cvPortfolioAlignment) {
    return null;
  }

  const alignment = report.cvPortfolioAlignment;

  return {
    id: CV_ALIGNMENT_REPORT_ID,
    title: "CV ↔ GitHub Alignment Report",
    defaultExpanded: true,
    header: {
      title: "CV ↔ GitHub Alignment Report",
      sources: [{ label: "GitHub Portfolio" }, { label: "Uploaded CV" }],
      generatedAt: alignment.metadata.generatedAt,
      repositoryCount: alignment.metadata.repositoryCount,
      alignmentScore: alignment.overallAlignmentScore,
    },
    sections: [
      { id: "cv-overall-alignment", label: "Overall Alignment" },
      { id: "cv-supported-claims", label: "Supported Claims" },
      { id: "cv-weakly-supported-claims", label: "Weakly Supported Claims" },
      { id: "cv-unsupported-claims", label: "Unsupported Claims" },
      {
        id: "cv-missing-strengths",
        label: "Missing CV Strengths",
      },
      { id: "cv-recommendations", label: "Recommendations" },
    ],
  };
}

export function buildReportsWorkspace(
  report: DeveloperPortfolioReport,
  options?: { skipNotice?: string | null },
): ReportsWorkspaceModel {
  const reports: WorkspaceReportModel[] = [
    buildPortfolioAssessmentReport(report),
  ];

  const cvAlignmentReport = buildCvAlignmentReport(report);
  if (cvAlignmentReport) {
    reports.push(cvAlignmentReport);
  }

  return {
    reports,
    skipNotice: options?.skipNotice ?? null,
  };
}

export function getDefaultExpandedReportIds(
  workspace: ReportsWorkspaceModel,
): string[] {
  return workspace.reports
    .filter((workspaceReport) => workspaceReport.defaultExpanded)
    .map((workspaceReport) => workspaceReport.id);
}

export function buildWorkspaceNavigationGroups(
  workspace: ReportsWorkspaceModel,
  expandedReportIds: string[],
) {
  return workspace.reports
    .filter((workspaceReport) => expandedReportIds.includes(workspaceReport.id))
    .map((workspaceReport) => ({
      reportId: workspaceReport.id,
      reportTitle: workspaceReport.title,
      sections: workspaceReport.sections,
    }));
}
