import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { ReportSectionView } from "@/components/ReportSection";
import { TechnologyBreakdown } from "@/components/TechnologyBreakdown";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import { consolidateImprovementSuggestions } from "@/lib/presentation/improvementSuggestions";
import {
  buildExecutiveSummary,
  categorizeTechnologies,
  slugFromLensId,
} from "@/lib/presentation/reportPresentation";

interface PortfolioAssessmentReportContentProps {
  report: DeveloperPortfolioReport;
}

export function PortfolioAssessmentReportContent({
  report,
}: PortfolioAssessmentReportContentProps) {
  const { developerSnapshot, sections } = report;
  const improvementSuggestions = consolidateImprovementSuggestions(report);
  const executiveSummary = buildExecutiveSummary(report);
  const technologyGroups = categorizeTechnologies(report);

  return (
    <>
      {developerSnapshot.bio && (
        <section className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">GitHub profile summary</p>
          <p className="mt-1 text-slate-700">{developerSnapshot.bio}</p>
          <a
            href={developerSnapshot.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            View GitHub profile
          </a>
        </section>
      )}

      <ExecutiveSummary
        developer={developerSnapshot}
        summary={executiveSummary}
        sectionId="portfolio-executive-summary"
      />

      <TechnologyBreakdown
        groups={technologyGroups}
        sectionId="portfolio-technology-breakdown"
      />

      {sections.map((section) => (
        <ReportSectionView
          key={section.lensId}
          section={section}
          sectionId={`portfolio-${slugFromLensId(section.lensId)}`}
        />
      ))}

      {improvementSuggestions.length > 0 && (
        <section
          id="portfolio-improvement-suggestions"
          className="scroll-mt-20 rounded-xl border border-amber-200 bg-amber-50 p-6"
        >
          <h3 className="text-lg font-semibold text-amber-900">
            Portfolio improvement suggestions
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-amber-900">
            {improvementSuggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
