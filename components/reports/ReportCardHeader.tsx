import type { WorkspaceReportHeader } from "@/lib/presentation/reportsWorkspace";
import { formatReportTimestamp } from "@/lib/presentation/reportsWorkspace";

interface ReportCardHeaderProps {
  header: WorkspaceReportHeader;
}

export function ReportCardHeader({ header }: ReportCardHeaderProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">{header.title}</h2>

      <div className="mt-3 space-y-2 text-sm text-slate-600">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Generated from
          </p>
          <ul className="mt-1 space-y-1">
            {header.sources.map((source) => (
              <li key={source.label} className="text-slate-700">
                ✓ {source.label}
              </li>
            ))}
          </ul>
        </div>

        {header.developerLabel && (
          <p>
            <span className="text-slate-500">Developer:</span>{" "}
            <span className="font-medium text-slate-800">{header.developerLabel}</span>
          </p>
        )}

        {typeof header.repositoryCount === "number" && (
          <p>
            <span className="font-medium text-slate-800">
              {header.repositoryCount}
            </span>{" "}
            {header.repositoryCount === 1
              ? "repository analyzed"
              : "repositories analyzed"}
          </p>
        )}

        {typeof header.alignmentScore === "number" && (
          <p>
            <span className="text-slate-500">Alignment score:</span>{" "}
            <span className="font-medium text-slate-800">
              {header.alignmentScore} / 100
            </span>
          </p>
        )}

        <p>
          <span className="text-slate-500">Generated:</span>{" "}
          <span className="font-medium text-slate-800">
            {formatReportTimestamp(header.generatedAt)}
          </span>
        </p>
      </div>
    </div>
  );
}
