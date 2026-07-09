import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";
import type { CvNormalizationModelResponse } from "@/lib/azure/cvNormalizerSchema";
import { normalizeTechnologyName } from "@/lib/technology/normalization";

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function optionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeMonthDate(value: string | undefined): string | undefined {
  const trimmed = optionalString(value);
  if (!trimmed) {
    return undefined;
  }

  const yearMonth = trimmed.match(/(19|20)\d{2}[-/.](\d{1,2})/);
  if (yearMonth) {
    const year = yearMonth[0].slice(0, 4);
    const month = yearMonth[0].replace(/.*[-/.]/, "").padStart(2, "0");
    return `${year}-${month}`;
  }

  const monthYear = trimmed.match(/(\d{1,2})[-/.](19|20)\d{2}/);
  if (monthYear) {
    const year = monthYear[0].slice(-4);
    const month = monthYear[0].slice(0, 2).padStart(2, "0");
    return `${year}-${month}`;
  }

  const yearOnly = trimmed.match(/\b(19|20)\d{2}\b/);
  if (yearOnly) {
    return `${yearOnly[0]}-01`;
  }

  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  return undefined;
}

function normalizeSkillEntries(entries: string[]): string[] {
  const normalized = new Map<string, string>();

  for (const entry of entries) {
    for (const token of entry.split(/[,;|/]/)) {
      const cleaned = normalizeTechnologyName(token.trim());
      if (cleaned) {
        normalized.set(cleaned.toLowerCase(), cleaned);
      }
    }
  }

  return [...normalized.values()].sort((left, right) =>
    left.localeCompare(right),
  );
}

export function mapCvNormalizationResponseToCandidateEvidence(
  response: CvNormalizationModelResponse,
): CandidateEvidenceModel {
  return {
    personalInformation: {
      confidence: clampConfidence(response.personalInformation.confidence),
      fullName: optionalString(response.personalInformation.fullName),
      email: optionalString(response.personalInformation.email),
      phone: optionalString(response.personalInformation.phone),
      location: optionalString(response.personalInformation.location),
      websites: response.personalInformation.websites
        .map((website) => website.trim())
        .filter(Boolean),
    },
    executiveSummary: {
      confidence: clampConfidence(response.executiveSummary.confidence),
      text: optionalString(response.executiveSummary.text),
    },
    skills: {
      confidence: clampConfidence(response.skills.confidence),
      entries: normalizeSkillEntries(response.skills.entries),
    },
    employmentHistory: {
      confidence: clampConfidence(response.employmentHistory.confidence),
      entries: response.employmentHistory.entries
        .map((entry) => ({
          company: optionalString(entry.company),
          role: optionalString(entry.role),
          startDate: normalizeMonthDate(entry.startDate),
          endDate: normalizeMonthDate(entry.endDate),
          description: optionalString(entry.description),
          location: optionalString(entry.location),
        }))
        .filter(
          (entry) =>
            entry.company ||
            entry.role ||
            entry.description ||
            entry.startDate ||
            entry.endDate,
        ),
    },
    education: {
      confidence: clampConfidence(response.education.confidence),
      entries: response.education.entries
        .map((entry) => ({
          institution: optionalString(entry.institution),
          degree: optionalString(entry.degree),
          fieldOfStudy: optionalString(entry.fieldOfStudy),
          startDate: normalizeMonthDate(entry.startDate),
          endDate: normalizeMonthDate(entry.endDate),
        }))
        .filter(
          (entry) =>
            entry.institution ||
            entry.degree ||
            entry.fieldOfStudy ||
            entry.startDate ||
            entry.endDate,
        ),
    },
    certifications: {
      confidence: clampConfidence(response.certifications.confidence),
      entries: response.certifications.entries
        .map((entry) => ({
          name: optionalString(entry.name),
          issuer: optionalString(entry.issuer),
          date: normalizeMonthDate(entry.date),
        }))
        .filter((entry) => entry.name || entry.issuer || entry.date),
    },
    projects: {
      confidence: clampConfidence(response.projects.confidence),
      entries: response.projects.entries
        .map((entry) => ({
          name: optionalString(entry.name),
          description: optionalString(entry.description),
          link: optionalString(entry.link),
          technologies: normalizeSkillEntries(entry.technologies ?? []),
        }))
        .filter((entry) => entry.name || entry.description || entry.link),
    },
    languages: {
      confidence: clampConfidence(response.languages.confidence),
      entries: response.languages.entries
        .map((entry) => ({
          language: optionalString(entry.language),
          proficiency: optionalString(entry.proficiency),
        }))
        .filter((entry) => entry.language || entry.proficiency),
    },
  };
}
