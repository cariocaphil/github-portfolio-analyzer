import { ExecutiveSummary } from "@/components/ExecutiveSummary";
import { ReportNavigation } from "@/components/ReportNavigation";
import { ReportSectionView } from "@/components/ReportSection";
import { ReportVisuals } from "@/components/ReportVisuals";
import { TechnologyBreakdown } from "@/components/TechnologyBreakdown";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import { consolidateImprovementSuggestions } from "@/lib/presentation/improvementSuggestions";
import {
  buildExecutiveSummary,
  categorizeTechnologies,
  distributionFromSections,
  slugFromLensId,
  toSectionSummary,
} from "@/lib/presentation/reportPresentation";

interface ReportViewProps {
  report: DeveloperPortfolioReport;
}

export function ReportView({ report }: ReportViewProps) {
  const { developerSnapshot, sections } = report;
  const improvementSuggestions = consolidateImprovementSuggestions(report);
  const executiveSummary = buildExecutiveSummary(report);
  const technologyGroups = categorizeTechnologies(report);
  const sectionSummaries = sections.map(toSectionSummary);

  const navigationItems = [
    { id: "executive-summary", label: "Executive Summary" },
    { id: "technology-breakdown", label: "Technology Breakdown" },
    { id: "visual-summary", label: "Visual Summary" },
    ...sections.map((section) => ({
      id: slugFromLensId(section.lensId),
      label: section.title,
    })),
    { id: "improvement-suggestions", label: "Improvement Suggestions" },
  ];

  const technologyDistribution = technologyGroups.map((group) => ({
    label: group.category,
    value: group.technologies.length,
  }));
  const lensDistribution = distributionFromSections(sections);

  const repositoryEvidenceCounts = new Map<string, number>();
  for (const section of sections) {
    for (const observation of section.observations) {
      for (const evidence of observation.supportingEvidence) {
        repositoryEvidenceCounts.set(
          evidence.repository,
          (repositoryEvidenceCounts.get(evidence.repository) ?? 0) + 1,
        );
      }
    }
  }

  const repositoryTypeDistribution = [
    {
      label: "High evidence (6+)",
      value: [...repositoryEvidenceCounts.values()].filter((count) => count >= 6)
        .length,
    },
    {
      label: "Medium evidence (3-5)",
      value: [...repositoryEvidenceCounts.values()].filter(
        (count) => count >= 3 && count <= 5,
      ).length,
    },
    {
      label: "Low evidence (1-2)",
      value: [...repositoryEvidenceCounts.values()].filter((count) => count <= 2)
        .length,
    },
  ];

  return (
    <div id="top" className="mt-10 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <ReportNavigation items={navigationItems} />

      <div className="space-y-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Engineering Evidence Report
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Developer</p>
              <p className="font-medium text-slate-900">
                {developerSnapshot.name
                  ? `${developerSnapshot.name} (@${developerSnapshot.username})`
                  : `@${developerSnapshot.username}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Repositories analyzed</p>
              <p className="font-medium text-slate-900">
                {developerSnapshot.totalRepositories}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Primary languages</p>
              <p className="font-medium text-slate-900">
                {developerSnapshot.primaryLanguages.length > 0
                  ? developerSnapshot.primaryLanguages.join(", ")
                  : "None detected"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">GitHub profile</p>
              <a
                href={developerSnapshot.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                View profile
              </a>
            </div>
          </div>
          {developerSnapshot.bio && (
            <p className="mt-4 text-slate-600">{developerSnapshot.bio}</p>
          )}
        </section>

        <ExecutiveSummary
          developer={developerSnapshot}
          summary={executiveSummary}
        />

        <TechnologyBreakdown groups={technologyGroups} />

        <ReportVisuals
          lensDistribution={lensDistribution}
          technologyDistribution={technologyDistribution}
          repositoryTypeDistribution={repositoryTypeDistribution}
        />

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Lens Highlights Snapshot
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sectionSummaries.map((summary) => (
              <a
                key={summary.section.lensId}
                href={`#${slugFromLensId(summary.section.lensId)}`}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {summary.section.title}
                </p>
                <p className="mt-1 text-xs text-slate-600">Score: {summary.score}</p>
                <p className="mt-1 text-sm text-slate-700">{summary.summary}</p>
              </a>
            ))}
          </div>
        </section>

        {sections.map((section) => (
          <ReportSectionView key={section.lensId} section={section} />
        ))}

        {improvementSuggestions.length > 0 && (
          <section
            id="improvement-suggestions"
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
            <a
              href="#top"
              className="mt-4 inline-block text-sm font-medium text-amber-900 underline"
            >
              Back to top
            </a>
          </section>
        )}
      </div>
    </div>
  );
}
