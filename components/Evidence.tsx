import type { EvidenceSource } from "@/lib/models/evidence";

interface EvidenceViewProps {
  evidence: EvidenceSource;
}

export function EvidenceView({ evidence }: EvidenceViewProps) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
        <span>
          <span className="font-medium text-slate-700">Repository:</span>{" "}
          {evidence.repository}
        </span>
        <span>
          <span className="font-medium text-slate-700">Path:</span> {evidence.path}
        </span>
      </div>
      <p className="mt-2 text-slate-700">{evidence.description}</p>
      {evidence.facts.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
          {evidence.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      )}
      {evidence.githubUrl && (
        <a
          href={evidence.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-blue-600 hover:underline"
        >
          View on GitHub
        </a>
      )}
    </div>
  );
}
