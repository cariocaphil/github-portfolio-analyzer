import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";
import type { CvExtractionSummary } from "@/lib/cv/buildCvExtractionSummary";

export function buildCandidateEvidenceSummary(
  candidateEvidence: CandidateEvidenceModel,
): CvExtractionSummary {
  return {
    skills: candidateEvidence.skills.entries.length,
    employmentHistory: candidateEvidence.employmentHistory.entries.length,
    education: candidateEvidence.education.entries.length,
    certifications: candidateEvidence.certifications.entries.length,
    languages: candidateEvidence.languages.entries.length,
    projects: candidateEvidence.projects.entries.length,
  };
}
