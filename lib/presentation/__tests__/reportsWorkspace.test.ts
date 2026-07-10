import { describe, expect, it } from "vitest";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import {
  buildCvAlignmentReport,
  buildPortfolioAssessmentReport,
  buildReportsWorkspace,
  buildWorkspaceNavigationGroups,
  CV_ALIGNMENT_REPORT_ID,
  getDefaultExpandedReportIds,
  PORTFOLIO_ASSESSMENT_REPORT_ID,
} from "@/lib/presentation/reportsWorkspace";

function createBaseReport(): DeveloperPortfolioReport {
  return {
    developerSnapshot: {
      username: "dev-user",
      name: "Dev User",
      bio: "Building tools.",
      totalRepositories: 3,
      primaryLanguages: ["TypeScript"],
      accountCreated: "2021-01-01T00:00:00Z",
      profileUrl: "https://github.com/dev-user",
    },
    sections: [
      {
        lensId: "technical-breadth",
        title: "Technical Breadth",
        guidingQuestion: "What technologies are demonstrated?",
        observations: [],
      },
      {
        lensId: "project-complexity",
        title: "Project Complexity",
        guidingQuestion: "How complex are the projects?",
        observations: [],
      },
    ],
    improvementSuggestions: ["Add CI workflows."],
    metadata: {
      analysisSource: "mock",
      generationTimestamp: "2026-07-09T19:25:00.000Z",
    },
  };
}

describe("reportsWorkspace", () => {
  it("builds only the portfolio report when CV alignment is absent", () => {
    const workspace = buildReportsWorkspace(createBaseReport());

    expect(workspace.reports).toHaveLength(1);
    expect(workspace.reports[0]?.id).toBe(PORTFOLIO_ASSESSMENT_REPORT_ID);
    expect(workspace.reports[0]?.defaultExpanded).toBe(true);
    expect(buildCvAlignmentReport(createBaseReport())).toBeNull();
  });

  it("builds both reports when CV alignment is available", () => {
    const report: DeveloperPortfolioReport = {
      ...createBaseReport(),
      cvAlignmentStatus: "completed",
      cvPortfolioAlignment: {
        summary: "Solid overlap.",
        overallAlignmentScore: 72,
        supportedClaims: [],
        weaklySupportedClaims: [],
        unsupportedClaims: [],
        missingCvStrengths: [],
        recommendations: [],
        metadata: {
          provider: "AzureCvPortfolioAlignment",
          generatedAt: "2026-07-09T19:28:00.000Z",
          repositoryCount: 3,
        },
      },
    };

    const workspace = buildReportsWorkspace(report);

    expect(workspace.reports).toHaveLength(2);
    expect(workspace.reports[1]?.id).toBe(CV_ALIGNMENT_REPORT_ID);
    expect(workspace.reports[1]?.header.alignmentScore).toBe(72);
    expect(getDefaultExpandedReportIds(workspace)).toEqual([
      PORTFOLIO_ASSESSMENT_REPORT_ID,
      CV_ALIGNMENT_REPORT_ID,
    ]);
  });

  it("keeps portfolio and alignment sections in separate navigation groups", () => {
    const report: DeveloperPortfolioReport = {
      ...createBaseReport(),
      cvAlignmentStatus: "completed",
      cvPortfolioAlignment: {
        summary: "Solid overlap.",
        overallAlignmentScore: 72,
        supportedClaims: [],
        weaklySupportedClaims: [],
        unsupportedClaims: [],
        missingCvStrengths: [],
        recommendations: [],
        metadata: {
          provider: "AzureCvPortfolioAlignment",
          generatedAt: "2026-07-09T19:28:00.000Z",
          repositoryCount: 3,
        },
      },
    };

    const workspace = buildReportsWorkspace(report);
    const navigation = buildWorkspaceNavigationGroups(
      workspace,
      getDefaultExpandedReportIds(workspace),
    );

    expect(navigation).toHaveLength(2);
    expect(navigation[0]?.sections.some((section) => section.id.startsWith("portfolio-"))).toBe(
      true,
    );
    expect(navigation[1]?.sections.every((section) => section.id.startsWith("cv-"))).toBe(
      true,
    );
    expect(
      navigation[0]?.sections.some(
        (section) => section.id === "portfolio-executive-summary",
      ),
    ).toBe(true);
    expect(
      navigation[1]?.sections.some(
        (section) => section.id === "cv-overall-alignment",
      ),
    ).toBe(true);
  });

  it("only includes expanded reports in navigation", () => {
    const workspace = buildReportsWorkspace(createBaseReport());
    const navigation = buildWorkspaceNavigationGroups(workspace, []);

    expect(navigation).toHaveLength(0);
  });

  it("includes portfolio metadata in the report header model", () => {
    const portfolioReport = buildPortfolioAssessmentReport(createBaseReport());

    expect(portfolioReport.header.sources).toEqual([
      { label: "GitHub Portfolio" },
    ]);
    expect(portfolioReport.header.repositoryCount).toBe(3);
    expect(portfolioReport.isPrimary).toBe(true);
  });
});
