import type { DeveloperPortfolioReport } from "@/lib/models/report";
import { ReportSectionView } from "@/components/ReportSection";

interface ReportViewProps {
  report: DeveloperPortfolioReport;
}

export function ReportView({ report }: ReportViewProps) {
  const { developerSnapshot, sections, improvementSuggestions } = report;

  return (
    <div className="mt-10 space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
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

      {sections.map((section) => (
        <ReportSectionView key={section.lensId} section={section} />
      ))}

      {improvementSuggestions.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
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
    </div>
  );
}
