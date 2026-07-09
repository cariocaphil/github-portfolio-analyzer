export interface PersonalInformation {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  websites: string[];
}

export interface EmploymentEntry {
  company?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  location?: string;
}

export interface EducationEntry {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

export interface CertificationEntry {
  name?: string;
  issuer?: string;
  date?: string;
}

export interface LanguageEntry {
  language?: string;
  proficiency?: string;
}

export interface ProjectEntry {
  name?: string;
  description?: string;
  link?: string;
}

export interface CandidateCv {
  personalInformation: PersonalInformation;
  summary?: string;
  skills: string[];
  employmentHistory: EmploymentEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  projects: ProjectEntry[];
}

export function createEmptyCandidateCv(): CandidateCv {
  return {
    personalInformation: {
      websites: [],
    },
    skills: [],
    employmentHistory: [],
    education: [],
    certifications: [],
    languages: [],
    projects: [],
  };
}
