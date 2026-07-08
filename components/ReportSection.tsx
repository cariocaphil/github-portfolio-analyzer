import { useState } from "react";
import type { ReportSection } from "@/lib/models/report";
import {
  groupEvidenceByRepository,
  slugFromLensId,
  toSectionSummary,
} from "@/lib/presentation/reportPresentation";

interface ReportSectionViewProps {
  section: ReportSection;
}

export function ReportSectionView({ section }: ReportSectionViewProps) {
  const [openRepositories, setOpenRepositories] = useState<Record<string, boolean>>(
    {},
  );
  const scoreSummary = toSectionSummary(section);
  const repositoryGroups = groupEvidenceByRepository(section);

  const keyFindings = section.observations.slice(0, 3);

  function toggleRepository(repository: string) {
    setOpenRepositories((current) => ({
      ...current,
      [repository]: !current[repository],
    }));
  }

  return (
    <section
      id={slugFromLensId(section.lensId)}
      className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <header className="border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-medium text-slate-600">Guiding question:</span>{" "}
              {section.guidingQuestion}
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            Score: {scoreSummary.score || "N/A"}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700">{scoreSummary.summary}</p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Key findings
          </h4>
          {keyFindings.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No findings were generated for this lens.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {keyFindings.map((finding, index) => (
                <li key={`${section.lensId}-finding-${index}`} className="text-sm">
                  <p className="font-medium text-slate-900">{finding.observation}</p>
                  <p className="mt-1 text-slate-600">{finding.rationale}</p>
                  <a
                    href={`#${slugFromLensId(section.lensId)}-repo-explorer`}
                    className="mt-1 inline-block text-xs font-medium text-blue-700 hover:underline"
                  >
                    View supporting evidence
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Supporting evidence
          </h4>
          <p className="mt-3 text-sm text-slate-600">
            {section.observations.reduce(
              (total, observation) => total + observation.supportingEvidence.length,
              0,
            )}{" "}
            evidence links across {repositoryGroups.length} repositories.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Expand each repository below to inspect confidence, rationale, source files,
            extracted facts, and linked GitHub references.
          </p>
        </section>
      </div>

      <section
        id={`${slugFromLensId(section.lensId)}-repo-explorer`}
        className="mt-8 space-y-3"
      >
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Repository explorer
        </h4>

        {repositoryGroups.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No repository-level supporting evidence is available for this lens.
          </p>
        ) : (
          repositoryGroups.map((group) => {
            const isOpen = openRepositories[group.repository] ?? false;
            return (
              <article
                key={`${section.lensId}-${group.repository}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleRepository(group.repository)}
                  className="flex w-full items-start justify-between gap-4 p-4 text-left hover:bg-slate-50"
                  aria-expanded={isOpen}
                >
                  <div>
                    <h5 className="text-sm font-semibold text-slate-900">
                      {group.repository}
                    </h5>
                    <p className="mt-1 text-sm text-slate-600">{group.repositoryPurpose}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.primaryTechnologies.length > 0 ? (
                        group.primaryTechnologies.map((technology) => (
                          <span
                            key={`${group.repository}-${technology}`}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                          >
                            {technology}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">
                          Primary technologies not inferred
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex min-w-24 flex-col items-end gap-1 text-xs text-slate-500">
                    <span>{group.evidenceCount} evidence item(s)</span>
                    <span>{isOpen ? "Collapse" : "Expand"}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-200 bg-slate-50 p-4">
                    <section>
                      <h6 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Key achievements
                      </h6>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {group.keyAchievements.map((achievement) => (
                          <li key={`${group.repository}-${achievement}`}>{achievement}</li>
                        ))}
                      </ul>
                    </section>

                    <section className="mt-4 space-y-3">
                      {group.items.map((item) => (
                        <details
                          key={item.evidence.id}
                          className="rounded-md border border-slate-200 bg-white p-3"
                        >
                          <summary className="cursor-pointer text-sm font-medium text-slate-900">
                            {item.evidence.description}
                          </summary>
                          <div className="mt-3 space-y-2 text-sm text-slate-700">
                            <p>
                              <span className="font-medium">Path:</span> {item.evidence.path}
                            </p>
                            <p>
                              <span className="font-medium">Reasoning:</span>{" "}
                              {item.observations[0]?.rationale ?? "No rationale available."}
                            </p>
                            <p>
                              <span className="font-medium">Confidence:</span>{" "}
                              {item.observations[0]?.confidence ?? "N/A"}
                            </p>
                            {item.evidence.facts.length > 0 && (
                              <div>
                                <p className="font-medium">Extracted snippets:</p>
                                <ul className="mt-1 list-disc space-y-1 pl-5">
                                  {item.evidence.facts.map((fact) => (
                                    <li key={`${item.evidence.id}-${fact}`}>{fact}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {item.evidence.githubUrl && (
                              <a
                                href={item.evidence.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-blue-700 hover:underline"
                              >
                                Open source file on GitHub
                              </a>
                            )}
                          </div>
                        </details>
                      ))}
                    </section>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </section>
  );
}
