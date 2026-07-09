import type { DeveloperSnapshot } from "@/lib/models/report";
import type { ExecutiveSummaryViewModel } from "@/lib/presentation/reportPresentation";

interface ExecutiveSummaryProps {
  developer: DeveloperSnapshot;
  summary: ExecutiveSummaryViewModel;
}

export function ExecutiveSummary({ developer, summary }: ExecutiveSummaryProps) {
  return (
    <section
      id="executive-summary"
      className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-slate-900">Executive Summary</h2>
      <p className="mt-1 text-sm text-slate-600">
        Portfolio assessment based on observable engineering evidence across{" "}
        {developer.totalRepositories} repositories.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="Overall Portfolio Score" value={`${summary.overallPortfolioScore}`} />
        <SummaryCard label="Seniority Estimate" value={summary.seniorityEstimate} />
        <SummaryCard label="AI Readiness" value={summary.aiReadiness} />
        <SummaryCard label="Strength Summary" value={summary.strengthSummary} />
        <SummaryCard
          label="Primary Technical Domains"
          value={
            summary.primaryTechnicalDomains.length > 0
              ? summary.primaryTechnicalDomains.join(", ")
              : "No strong domain clusters"
          }
        />
        <SummaryCard
          label="Recommended Career Positioning"
          value={summary.recommendedCareerPositioning}
        />
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </h3>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </article>
  );
}
