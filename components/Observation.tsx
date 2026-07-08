import type { ReportObservation } from "@/lib/models/report";
import { EvidenceView } from "@/components/Evidence";

interface ObservationViewProps {
  observation: ReportObservation;
}

const confidenceStyles = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-slate-100 text-slate-700",
} as const;

export function ObservationView({ observation }: ObservationViewProps) {
  return (
    <article className="rounded-md border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-slate-900">{observation.observation}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${confidenceStyles[observation.confidence]}`}
        >
          {observation.confidence} confidence
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        <span className="font-medium text-slate-700">Rationale:</span>{" "}
        {observation.rationale}
      </p>

      {observation.supportingEvidence.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">
            Supporting evidence
          </p>
          {observation.supportingEvidence.map((evidence) => (
            <EvidenceView key={evidence.id} evidence={evidence} />
          ))}
        </div>
      )}
    </article>
  );
}
