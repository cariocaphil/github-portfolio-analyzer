import type { ReportSection } from "@/lib/models/report";
import {
  getDistinctKeyFindings,
  getRepresentativeRepositories,
  shouldShowFindingRationale,
  slugFromLensId,
  toSectionSummary,
} from "@/lib/presentation/reportPresentation";

interface ReportSectionViewProps {
  section: ReportSection;
}

export function ReportSectionView({ section }: ReportSectionViewProps) {
  const scoreSummary = toSectionSummary(section);
  const keyFindings = getDistinctKeyFindings(section, scoreSummary.summary, 3);
  const representativeRepositories = getRepresentativeRepositories(section);

  return (
    <section
      id={slugFromLensId(section.lensId)}
      className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <header className="border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{section.guidingQuestion}</p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            Score: {scoreSummary.score || "N/A"}
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{scoreSummary.summary}</p>
      </header>

      {keyFindings.length > 0 && (
        <section className="mt-6">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Key findings
          </h4>
          <ul className="mt-3 space-y-3">
            {keyFindings.map((finding, index) => (
              <li key={`${section.lensId}-finding-${index}`} className="text-sm">
                <p className="font-medium text-slate-900">{finding.observation}</p>
                {shouldShowFindingRationale(finding.rationale) && (
                  <p className="mt-1 text-slate-600">{finding.rationale}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {representativeRepositories.length > 0 && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Representative repositories
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-800">
            {representativeRepositories.map((repository) => (
              <li key={`${section.lensId}-${repository.repository}`}>
                <span className="font-medium text-slate-900">
                  {repository.displayName}
                </span>
                <span className="text-slate-600"> — {repository.highlight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
