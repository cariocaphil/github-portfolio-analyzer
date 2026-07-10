"use client";

import { useEffect, useMemo, useState } from "react";
import { CollapsibleReportCard } from "@/components/reports/CollapsibleReportCard";
import { CvAlignmentReportContent } from "@/components/reports/CvAlignmentReportContent";
import { PortfolioAssessmentReportContent } from "@/components/reports/PortfolioAssessmentReportContent";
import { ReportCardHeader } from "@/components/reports/ReportCardHeader";
import { ReportNavigation } from "@/components/ReportNavigation";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import { getCvAlignmentSkipMessage } from "@/lib/presentation/cvPortfolioAlignmentPresentation";
import {
  buildReportsWorkspace,
  buildWorkspaceNavigationGroups,
  CV_ALIGNMENT_REPORT_ID,
  getDefaultExpandedReportIds,
  PORTFOLIO_ASSESSMENT_REPORT_ID,
} from "@/lib/presentation/reportsWorkspace";

interface ReportsWorkspaceProps {
  report: DeveloperPortfolioReport;
}

export function ReportsWorkspace({ report }: ReportsWorkspaceProps) {
  const workspace = useMemo(
    () =>
      buildReportsWorkspace(report, {
        skipNotice: getCvAlignmentSkipMessage(report),
      }),
    [report],
  );

  const [expandedReportIds, setExpandedReportIds] = useState<string[]>(() =>
    getDefaultExpandedReportIds(workspace),
  );

  useEffect(() => {
    setExpandedReportIds(getDefaultExpandedReportIds(workspace));
  }, [workspace]);

  function toggleReport(reportId: string) {
    setExpandedReportIds((current) =>
      current.includes(reportId)
        ? current.filter((id) => id !== reportId)
        : [...current, reportId],
    );
  }

  const navigationGroups = buildWorkspaceNavigationGroups(
    workspace,
    expandedReportIds,
  );

  return (
    <div id="top" className="mt-10 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <ReportNavigation groups={navigationGroups} />

      <div className="space-y-6">
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">Reports</h2>
          <p className="mt-1 text-sm text-slate-600">
            Independent analysis artifacts generated from your engineering
            assessment workspace.
          </p>
        </header>

        {workspace.skipNotice && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {workspace.skipNotice}
          </div>
        )}

        <div className="space-y-6">
          {workspace.reports.map((workspaceReport) => {
            const expanded = expandedReportIds.includes(workspaceReport.id);

            return (
              <CollapsibleReportCard
                key={workspaceReport.id}
                reportId={workspaceReport.id}
                title={workspaceReport.title}
                expanded={expanded}
                onToggle={toggleReport}
                isPrimary={workspaceReport.isPrimary}
                header={<ReportCardHeader header={workspaceReport.header} />}
              >
                {workspaceReport.id === PORTFOLIO_ASSESSMENT_REPORT_ID && (
                  <PortfolioAssessmentReportContent report={report} />
                )}

                {workspaceReport.id === CV_ALIGNMENT_REPORT_ID &&
                  report.cvPortfolioAlignment && (
                    <CvAlignmentReportContent
                      alignment={report.cvPortfolioAlignment}
                    />
                  )}
              </CollapsibleReportCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
