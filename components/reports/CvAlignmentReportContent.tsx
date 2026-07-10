import type { CvPortfolioAlignmentReport } from "@/domain/cvPortfolioAlignment";
import type { AlignmentFinding } from "@/domain/cvPortfolioAlignment";
import { formatAlignmentFindings } from "@/lib/presentation/cvPortfolioAlignmentPresentation";

interface CvAlignmentReportContentProps {
  alignment: CvPortfolioAlignmentReport;
}

export function CvAlignmentReportContent({
  alignment,
}: CvAlignmentReportContentProps) {
  return (
    <>
      <section
        id="cv-overall-alignment"
        className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-900">Overall Alignment</h3>
        <p className="mt-1 text-sm text-slate-600">
          Executive comparison between stated CV experience and observable GitHub
          portfolio evidence.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SummaryCard
            label="Overall Alignment Score"
            value={`${alignment.overallAlignmentScore} / 100`}
          />
          <SummaryCard
            label="Repositories Compared"
            value={`${alignment.metadata.repositoryCount}`}
          />
        </div>

        <p className="mt-5 text-slate-700">{alignment.summary}</p>
      </section>

      <FindingSection
        sectionId="cv-supported-claims"
        title="Supported Claims"
        findings={formatAlignmentFindings(alignment.supportedClaims)}
        emptyMessage="No clearly supported claims were identified."
      />

      <FindingSection
        sectionId="cv-weakly-supported-claims"
        title="Weakly Supported Claims"
        findings={formatAlignmentFindings(alignment.weaklySupportedClaims)}
        emptyMessage="No weakly supported claims were identified."
      />

      <FindingSection
        sectionId="cv-unsupported-claims"
        title="Unsupported Claims"
        findings={formatAlignmentFindings(alignment.unsupportedClaims)}
        emptyMessage="No unsupported claims were identified."
      />

      <FindingSection
        sectionId="cv-missing-strengths"
        title="GitHub Strengths Missing From CV"
        findings={formatAlignmentFindings(alignment.missingCvStrengths)}
        emptyMessage="No additional GitHub strengths were identified."
      />

      <section
        id="cv-recommendations"
        className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-900">Recommendations</h3>
        {alignment.recommendations.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No recommendations were generated for this comparison.
          </p>
        ) : (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            {alignment.recommendations.slice(0, 6).map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function FindingSection({
  sectionId,
  title,
  findings,
  emptyMessage,
}: {
  sectionId: string;
  title: string;
  findings: AlignmentFinding[];
  emptyMessage: string;
}) {
  return (
    <section
      id={sectionId}
      className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {findings.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {findings.map((finding) => (
            <li
              key={`${sectionId}-${finding.claimOrStrength}`}
              className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <p className="font-medium text-slate-900">{finding.claimOrStrength}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                {finding.category} · {finding.confidence} confidence
              </p>
              <p className="mt-2 text-sm text-slate-700">{finding.assessment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
