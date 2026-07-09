import type { AnalyzeResult } from "@azure/ai-form-recognizer";
import type { DocumentField } from "@azure/ai-form-recognizer";
import {
  type CandidateCv,
  createEmptyCandidateCv,
  type CertificationEntry,
  type EducationEntry,
  type EmploymentEntry,
  type LanguageEntry,
  type PersonalInformation,
  type ProjectEntry,
} from "@/lib/models/candidateCv";

function getStringValue(field: DocumentField | undefined): string | undefined {
  if (!field) {
    return undefined;
  }

  if (field.kind === "string" || field.kind === "phoneNumber") {
    return field.value ?? field.content;
  }

  if (field.kind === "date" && field.value) {
    return field.value.toISOString().slice(0, 10);
  }

  if (field.kind === "address" && field.value) {
    const address = field.value;
    return [
      address.streetAddress,
      address.city,
      address.state,
      address.postalCode,
      address.countryRegion,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return field.content;
}

function getArrayValues(field: DocumentField | undefined): DocumentField[] {
  if (!field || field.kind !== "array") {
    return [];
  }

  return field.values ?? [];
}

function getObjectProperties(
  field: DocumentField | undefined,
): Record<string, DocumentField | undefined> {
  if (!field || field.kind !== "object") {
    return {};
  }

  return field.properties ?? {};
}

function mapPersonalInformation(
  fields: Record<string, DocumentField | undefined>,
): PersonalInformation {
  const websites = getArrayValues(fields.Websites)
    .map((entry) => getStringValue(entry))
    .filter((value): value is string => Boolean(value));

  return {
    fullName: getStringValue(fields.CandidateName ?? fields.Name),
    email: getStringValue(fields.Email),
    phone: getStringValue(fields.PhoneNumber ?? fields.Phone),
    location: getStringValue(fields.Address ?? fields.Location),
    websites,
  };
}

function mapEmploymentHistory(
  fields: Record<string, DocumentField | undefined>,
): EmploymentEntry[] {
  return getArrayValues(fields.WorkExperience ?? fields.Experience).map(
    (entry) => {
      const properties = getObjectProperties(entry);
      return {
        company: getStringValue(properties.Company ?? properties.Employer),
        role: getStringValue(properties.Title ?? properties.JobTitle ?? properties.Role),
        startDate: getStringValue(properties.StartDate),
        endDate: getStringValue(properties.EndDate),
        description: getStringValue(properties.Description),
        location: getStringValue(properties.Location),
      };
    },
  );
}

function mapEducation(
  fields: Record<string, DocumentField | undefined>,
): EducationEntry[] {
  return getArrayValues(fields.Education).map((entry) => {
    const properties = getObjectProperties(entry);
    return {
      institution: getStringValue(properties.School ?? properties.Institution),
      degree: getStringValue(properties.Degree),
      fieldOfStudy: getStringValue(properties.Major ?? properties.FieldOfStudy),
      startDate: getStringValue(properties.StartDate),
      endDate: getStringValue(properties.EndDate),
    };
  });
}

function mapCertifications(
  fields: Record<string, DocumentField | undefined>,
): CertificationEntry[] {
  return getArrayValues(fields.Certifications).map((entry) => {
    const properties = getObjectProperties(entry);
    return {
      name: getStringValue(properties.Name ?? properties.Certification),
      issuer: getStringValue(properties.Issuer ?? properties.Authority),
      date: getStringValue(properties.Date),
    };
  });
}

function mapLanguages(
  fields: Record<string, DocumentField | undefined>,
): LanguageEntry[] {
  return getArrayValues(fields.Languages).map((entry) => {
    const properties = getObjectProperties(entry);
    const directLanguage = getStringValue(entry);

    if (directLanguage && Object.keys(properties).length === 0) {
      return { language: directLanguage };
    }

    return {
      language: getStringValue(properties.Language ?? properties.Name),
      proficiency: getStringValue(
        properties.Proficiency ?? properties.Level ?? properties.Fluency,
      ),
    };
  });
}

function mapProjects(
  fields: Record<string, DocumentField | undefined>,
): ProjectEntry[] {
  return getArrayValues(fields.Projects).map((entry) => {
    const properties = getObjectProperties(entry);
    return {
      name: getStringValue(properties.Name ?? properties.Title),
      description: getStringValue(properties.Description),
      link: getStringValue(properties.Link ?? properties.Url ?? properties.URL),
    };
  });
}

function mapSkills(fields: Record<string, DocumentField | undefined>): string[] {
  const skills = getArrayValues(fields.Skills)
    .map((entry) => getStringValue(entry))
    .filter((value): value is string => Boolean(value));

  const singleSkillField = getStringValue(fields.Skills);
  if (skills.length === 0 && singleSkillField) {
    return singleSkillField
      .split(/[,;|]/)
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return skills;
}

export function mapAzureResumeToCandidateCv(
  analysisResult: AnalyzeResult,
): CandidateCv {
  const document = analysisResult.documents?.[0];
  if (!document?.fields) {
    return createEmptyCandidateCv();
  }

  const fields = document.fields;

  return {
    personalInformation: mapPersonalInformation(fields),
    summary: getStringValue(fields.Summary ?? fields.Objective),
    skills: mapSkills(fields),
    employmentHistory: mapEmploymentHistory(fields),
    education: mapEducation(fields),
    certifications: mapCertifications(fields),
    languages: mapLanguages(fields),
    projects: mapProjects(fields),
  };
}
