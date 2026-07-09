"use client";

import { useState } from "react";
import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";
import type { CvExtractionSummary } from "@/lib/cv/buildCvExtractionSummary";
import type { CandidateCv } from "@/lib/models/candidateCv";

interface CvDeveloperPreviewProps {
  rawExtraction: CandidateCv;
  candidateEvidence: CandidateEvidenceModel | null;
  summary: CvExtractionSummary;
  normalizationError?: string;
}

type PreviewMode = "raw" | "canonical";

function formatConfidence(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) {
    return "n/a";
  }

  return value.toFixed(2);
}

function renderList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "None detected";
}

export function CvDeveloperPreview({
  rawExtraction,
  candidateEvidence,
  summary,
  normalizationError,
}: CvDeveloperPreviewProps) {
  const [mode, setMode] = useState<PreviewMode>(
    candidateEvidence ? "canonical" : "raw",
  );

  return (
    <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer text-sm font-medium text-slate-800">
        Developer preview
      </summary>

      <div className="mt-4 space-y-4">
        {normalizationError && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Normalization failed: {normalizationError}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("raw")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              mode === "raw"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200"
            }`}
          >
            Raw extraction
          </button>
          <button
            type="button"
            onClick={() => setMode("canonical")}
            disabled={!candidateEvidence}
            className={`rounded-md px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === "canonical"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200"
            }`}
          >
            Candidate evidence
          </button>
        </div>

        {mode === "raw" ? (
          <RawExtractionView extractedCv={rawExtraction} summary={summary} />
        ) : candidateEvidence ? (
          <CandidateEvidenceView candidateEvidence={candidateEvidence} />
        ) : (
          <p className="text-sm text-slate-600">
            Candidate evidence is unavailable because normalization did not complete.
          </p>
        )}
      </div>
    </details>
  );
}

function RawExtractionView({
  extractedCv,
  summary,
}: {
  extractedCv: CandidateCv;
  summary: CvExtractionSummary;
}) {
  const { personalInformation } = extractedCv;

  return (
    <div className="space-y-4 text-sm text-slate-700">
      <section>
        <h4 className="font-semibold text-slate-900">Personal information</h4>
        <ul className="mt-2 space-y-1">
          <li>Name: {personalInformation.fullName ?? "Not detected"}</li>
          <li>Email: {personalInformation.email ?? "Not detected"}</li>
          <li>Phone: {personalInformation.phone ?? "Not detected"}</li>
          <li>Location: {personalInformation.location ?? "Not detected"}</li>
          <li>Websites: {renderList(personalInformation.websites)}</li>
        </ul>
      </section>

      <section>
        <h4 className="font-semibold text-slate-900">Summary</h4>
        <p className="mt-2 whitespace-pre-wrap">
          {extractedCv.summary ?? "Not detected"}
        </p>
      </section>

      <section>
        <h4 className="font-semibold text-slate-900">
          Skills ({summary.skills})
        </h4>
        <p className="mt-2">{renderList(extractedCv.skills)}</p>
      </section>

      <section>
        <h4 className="font-semibold text-slate-900">
          Employment ({summary.employmentHistory})
        </h4>
        <ul className="mt-2 space-y-2">
          {extractedCv.employmentHistory.length === 0 && <li>None detected</li>}
          {extractedCv.employmentHistory.map((entry, index) => (
            <li key={`raw-employment-${index}`}>
              {[entry.role, entry.company].filter(Boolean).join(" at ") ||
                "Role not detected"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CandidateEvidenceView({
  candidateEvidence,
}: {
  candidateEvidence: CandidateEvidenceModel;
}) {
  const { personalInformation } = candidateEvidence;

  return (
    <div className="space-y-4 text-sm text-slate-700">
      <section>
        <h4 className="font-semibold text-slate-900">
          Personal information (confidence{" "}
          {formatConfidence(personalInformation.confidence)})
        </h4>
        <ul className="mt-2 space-y-1">
          <li>Name: {personalInformation.fullName ?? "Not detected"}</li>
          <li>Email: {personalInformation.email ?? "Not detected"}</li>
          <li>Phone: {personalInformation.phone ?? "Not detected"}</li>
          <li>Location: {personalInformation.location ?? "Not detected"}</li>
          <li>Websites: {renderList(personalInformation.websites)}</li>
        </ul>
      </section>

      <section>
        <h4 className="font-semibold text-slate-900">
          Executive summary (confidence{" "}
          {formatConfidence(candidateEvidence.executiveSummary.confidence)})
        </h4>
        <p className="mt-2 whitespace-pre-wrap">
          {candidateEvidence.executiveSummary.text ?? "Not detected"}
        </p>
      </section>

      <section>
        <h4 className="font-semibold text-slate-900">
          Skills (confidence {formatConfidence(candidateEvidence.skills.confidence)})
        </h4>
        <p className="mt-2">{renderList(candidateEvidence.skills.entries)}</p>
      </section>

      <section>
        <h4 className="font-semibold text-slate-900">
          Employment (confidence{" "}
          {formatConfidence(candidateEvidence.employmentHistory.confidence)})
        </h4>
        <ul className="mt-2 space-y-2">
          {candidateEvidence.employmentHistory.entries.length === 0 && (
            <li>None detected</li>
          )}
          {candidateEvidence.employmentHistory.entries.map((entry, index) => (
            <li key={`canonical-employment-${index}`}>
              {[entry.role, entry.company].filter(Boolean).join(" at ") ||
                "Role not detected"}
              {entry.startDate || entry.endDate
                ? ` (${[entry.startDate, entry.endDate].filter(Boolean).join(" – ")})`
                : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="font-semibold text-slate-900">
          Education (confidence{" "}
          {formatConfidence(candidateEvidence.education.confidence)})
        </h4>
        <ul className="mt-2 space-y-2">
          {candidateEvidence.education.entries.length === 0 && (
            <li>None detected</li>
          )}
          {candidateEvidence.education.entries.map((entry, index) => (
            <li key={`canonical-education-${index}`}>
              {[entry.degree, entry.fieldOfStudy, entry.institution]
                .filter(Boolean)
                .join(" · ") || "Entry not detected"}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="font-semibold text-slate-900">
          Certifications (confidence{" "}
          {formatConfidence(candidateEvidence.certifications.confidence)})
        </h4>
        <ul className="mt-2 space-y-1">
          {candidateEvidence.certifications.entries.length === 0 && (
            <li>None detected</li>
          )}
          {candidateEvidence.certifications.entries.map((entry, index) => (
            <li key={`canonical-certification-${index}`}>
              {[entry.name, entry.issuer].filter(Boolean).join(" · ") ||
                "Certification not detected"}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="font-semibold text-slate-900">
          Languages (confidence{" "}
          {formatConfidence(candidateEvidence.languages.confidence)})
        </h4>
        <p className="mt-2">
          {candidateEvidence.languages.entries.length === 0
            ? "None detected"
            : candidateEvidence.languages.entries
                .map((entry) =>
                  entry.language && entry.proficiency
                    ? `${entry.language} (${entry.proficiency})`
                    : entry.language ?? entry.proficiency ?? "Language not detected",
                )
                .join(", ")}
        </p>
      </section>

      <section>
        <h4 className="font-semibold text-slate-900">
          Projects (confidence{" "}
          {formatConfidence(candidateEvidence.projects.confidence)})
        </h4>
        <ul className="mt-2 space-y-2">
          {candidateEvidence.projects.entries.length === 0 && (
            <li>None detected</li>
          )}
          {candidateEvidence.projects.entries.map((entry, index) => (
            <li key={`canonical-project-${index}`}>
              {entry.name ?? "Project not detected"}
              {entry.description ? ` — ${entry.description}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
