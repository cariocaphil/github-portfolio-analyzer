export interface PersonalInformationEvidence {
  confidence: number;
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  websites: string[];
}

export interface ExecutiveSummaryEvidence {
  confidence: number;
  text?: string;
}

export interface SkillsEvidence {
  confidence: number;
  entries: string[];
}

export interface EmploymentEvidenceEntry {
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  location?: string;
}

export interface EmploymentHistoryEvidence {
  confidence: number;
  entries: EmploymentEvidenceEntry[];
}

export interface EducationEvidenceEntry {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

export interface EducationEvidence {
  confidence: number;
  entries: EducationEvidenceEntry[];
}

export interface CertificationEvidenceEntry {
  name?: string;
  issuer?: string;
  date?: string;
}

export interface CertificationsEvidence {
  confidence: number;
  entries: CertificationEvidenceEntry[];
}

export interface ProjectEvidenceEntry {
  name?: string;
  description?: string;
  link?: string;
  technologies?: string[];
}

export interface ProjectsEvidence {
  confidence: number;
  entries: ProjectEvidenceEntry[];
}

export interface LanguageEvidenceEntry {
  language?: string;
  proficiency?: string;
}

export interface LanguagesEvidence {
  confidence: number;
  entries: LanguageEvidenceEntry[];
}

export interface CandidateEvidenceModel {
  personalInformation: PersonalInformationEvidence;
  executiveSummary: ExecutiveSummaryEvidence;
  skills: SkillsEvidence;
  employmentHistory: EmploymentHistoryEvidence;
  education: EducationEvidence;
  certifications: CertificationsEvidence;
  projects: ProjectsEvidence;
  languages: LanguagesEvidence;
}

export function createEmptyCandidateEvidenceModel(): CandidateEvidenceModel {
  return {
    personalInformation: { confidence: 0, websites: [] },
    executiveSummary: { confidence: 0 },
    skills: { confidence: 0, entries: [] },
    employmentHistory: { confidence: 0, entries: [] },
    education: { confidence: 0, entries: [] },
    certifications: { confidence: 0, entries: [] },
    projects: { confidence: 0, entries: [] },
    languages: { confidence: 0, entries: [] },
  };
}
