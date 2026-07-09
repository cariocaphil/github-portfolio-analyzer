"use client";

import type { CandidateCv } from "@/lib/models/candidateCv";
import type { CvExtractionSummary } from "@/lib/cv/buildCvExtractionSummary";

interface CvExtractionDebugPanelProps {
  extractedCv: CandidateCv;
  summary: CvExtractionSummary;
}

function renderList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "None detected";
}

export function CvExtractionDebugPanel({
  extractedCv,
  summary,
}: CvExtractionDebugPanelProps) {
  const { personalInformation } = extractedCv;

  return (
    <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer text-sm font-medium text-slate-800">
        Extracted CV (developer view)
      </summary>

      <div className="mt-4 space-y-4 text-sm text-slate-700">
        <section>
          <h4 className="font-semibold text-slate-900">Personal Information</h4>
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
            {extractedCv.employmentHistory.length === 0 && (
              <li>None detected</li>
            )}
            {extractedCv.employmentHistory.map((entry, index) => (
              <li key={`employment-${index}`}>
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
            Education ({summary.education})
          </h4>
          <ul className="mt-2 space-y-2">
            {extractedCv.education.length === 0 && <li>None detected</li>}
            {extractedCv.education.map((entry, index) => (
              <li key={`education-${index}`}>
                {[entry.degree, entry.fieldOfStudy, entry.institution]
                  .filter(Boolean)
                  .join(" · ") || "Entry not detected"}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="font-semibold text-slate-900">
            Certifications ({summary.certifications})
          </h4>
          <ul className="mt-2 space-y-1">
            {extractedCv.certifications.length === 0 && (
              <li>None detected</li>
            )}
            {extractedCv.certifications.map((entry, index) => (
              <li key={`certification-${index}`}>
                {[entry.name, entry.issuer].filter(Boolean).join(" · ") ||
                  "Certification not detected"}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="font-semibold text-slate-900">
            Languages ({summary.languages})
          </h4>
          <p className="mt-2">
            {extractedCv.languages.length === 0
              ? "None detected"
              : extractedCv.languages
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
            Projects ({summary.projects})
          </h4>
          <ul className="mt-2 space-y-2">
            {extractedCv.projects.length === 0 && <li>None detected</li>}
            {extractedCv.projects.map((entry, index) => (
              <li key={`project-${index}`}>
                {entry.name ?? "Project not detected"}
                {entry.description ? ` — ${entry.description}` : ""}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </details>
  );
}
