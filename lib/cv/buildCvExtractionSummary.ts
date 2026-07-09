import type { CandidateCv } from "@/lib/models/candidateCv";

export interface CvExtractionSummary {
  skills: number;
  employmentHistory: number;
  education: number;
  certifications: number;
  languages: number;
  projects: number;
}

export function buildCvExtractionSummary(cv: CandidateCv): CvExtractionSummary {
  return {
    skills: cv.skills.length,
    employmentHistory: cv.employmentHistory.length,
    education: cv.education.length,
    certifications: cv.certifications.length,
    languages: cv.languages.length,
    projects: cv.projects.length,
  };
}
