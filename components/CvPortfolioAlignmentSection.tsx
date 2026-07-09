import type {
  AlignmentFinding,
  CvPortfolioAlignmentReport,
} from "@/domain/cvPortfolioAlignment";
import { formatAlignmentFindings } from "@/lib/presentation/cvPortfolioAlignmentPresentation";

interface CvPortfolioAlignmentSectionProps {
  alignment: CvPortfolioAlignmentReport;
}

export function CvPortfolioAlignmentSection({
  alignment,
}: CvPortfolioAlignmentSectionProps) {
  return (
    <section
      id="cv-github-alignment"
      className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-slate-900">
        CV ↔ GitHub Alignment
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Executive comparison between stated CV experience and observable GitHub
        portfolio evidence.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SummaryCard
          label="Overall Alignment Score"
          value={`${alignment.overallAlignmentScore}/100`}
        />
        <SummaryCard
          label="Repositories Compared"
          value={`${alignment.metadata.repositoryCount}`}
        />
      </div>

      <p className="mt-5 text-slate-700">{alignment.summary}</p>

      <FindingGroup
        title="Supported claims"
        findings={formatAlignmentFindings(alignment.supportedClaims)}
        emptyMessage="No clearly supported claims were identified."
      />

      <FindingGroup
        title="Weakly supported claims"
        findings={formatAlignmentFindings(alignment.weaklySupportedClaims)}
        emptyMessage="No weakly supported claims were identified."
      />

      <FindingGroup
        title="Unsupported or not visible claims"
        findings={formatAlignmentFindings(alignment.unsupportedClaims)}
        emptyMessage="No unsupported claims were identified."
      />

      <FindingGroup
        title="GitHub strengths missing from the CV"
        findings={formatAlignmentFindings(alignment.missingCvStrengths)}
        emptyMessage="No additional GitHub strengths were identified."
      />

      {alignment.recommendations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-base font-semibold text-slate-900">
            CV improvement recommendations
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-700">
            {alignment.recommendations.slice(0, 6).map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function FindingGroup({
  title,
  findings,
  emptyMessage,
}: {
  title: string;
  findings: AlignmentFinding[];
  emptyMessage: string;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {findings.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {findings.map((finding) => (
            <li
              key={`${title}-${finding.claimOrStrength}`}
              className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <p className="font-medium text-slate-900">
                {finding.claimOrStrength}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                {finding.category} · {finding.confidence} confidence
              </p>
              <p className="mt-2 text-sm text-slate-700">{finding.assessment}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
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
