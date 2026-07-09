import type { AnalyzeResult } from "@azure/ai-form-recognizer";
import type { DocumentTable } from "@azure/ai-form-recognizer";
import {
  type CandidateCv,
  createEmptyCandidateCv,
  type EducationEntry,
  type EmploymentEntry,
} from "@/lib/models/candidateCv";

const SECTION_ALIASES = {
  summary: ["summary", "profile", "about", "objective"],
  skills: ["skills", "technical skills", "core competencies", "competencies"],
  experience: [
    "experience",
    "work experience",
    "employment history",
    "professional experience",
    "work history",
  ],
  education: ["education", "academic background", "qualifications"],
  certifications: ["certifications", "certificates", "licenses"],
  languages: ["languages"],
  projects: ["projects", "selected projects"],
} as const;

function normalizeWhitespace(value: string): string {
  return value.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
}

function extractEmail(content: string): string | undefined {
  const match = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0];
}

function extractPhone(content: string): string | undefined {
  const match = content.match(
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/,
  );
  return match?.[0]?.trim();
}

function extractWebsites(content: string): string[] {
  const matches = content.match(/https?:\/\/[^\s)]+/gi) ?? [];
  return [...new Set(matches.map((url) => url.replace(/[.,;]+$/, "")))];
}

function extractSection(
  content: string,
  sectionNames: readonly string[],
): string | undefined {
  const allSections = Object.values(SECTION_ALIASES).flat();
  const headingPattern = sectionNames
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const nextHeadingPattern = allSections
    .filter((name) => !sectionNames.includes(name as (typeof sectionNames)[number]))
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const pattern = new RegExp(
    `(?:^|\\n)\\s*(?:${headingPattern})\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:${nextHeadingPattern})\\s*:?\\s*\\n|$)`,
    "i",
  );
  const match = content.match(pattern);
  return match?.[1] ? normalizeWhitespace(match[1]) : undefined;
}

function parseListItems(sectionText: string | undefined): string[] {
  if (!sectionText) {
    return [];
  }

  return sectionText
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter((line) => line.length > 0 && line.length < 120);
}

function parseSkills(sectionText: string | undefined): string[] {
  if (!sectionText) {
    return [];
  }

  const commaSeparated = sectionText
    .split(/[,;|]/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (commaSeparated.length >= 2) {
    return commaSeparated;
  }

  return parseListItems(sectionText);
}

function parseEmploymentSection(sectionText: string | undefined): EmploymentEntry[] {
  const lines = parseListItems(sectionText);
  return lines.map((line) => {
    const pipeParts = line.split("|").map((part) => part.trim());
    if (pipeParts.length >= 2) {
      return {
        role: pipeParts[0],
        company: pipeParts[1],
        startDate: pipeParts[2],
        endDate: pipeParts[3],
        description: pipeParts.slice(4).join(" ") || undefined,
      };
    }

    const atMatch = line.match(/^(.*?)\s+at\s+(.*?)(?:\s+\((.+)\))?$/i);
    if (atMatch) {
      return {
        role: atMatch[1]?.trim(),
        company: atMatch[2]?.trim(),
        startDate: atMatch[3]?.trim(),
      };
    }

    return { description: line };
  });
}

function parseEducationSection(sectionText: string | undefined): EducationEntry[] {
  return parseListItems(sectionText).map((line) => {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length >= 2) {
      return {
        degree: parts[0],
        institution: parts[1],
        endDate: parts[2],
      };
    }

    return { institution: line };
  });
}

function mapTablesToStructuredData(tables: DocumentTable[] | undefined): {
  employmentHistory: EmploymentEntry[];
  education: EducationEntry[];
} {
  const employmentHistory: EmploymentEntry[] = [];
  const education: EducationEntry[] = [];

  for (const table of tables ?? []) {
    const rows = new Map<number, string[]>();

    for (const cell of table.cells) {
      const row = rows.get(cell.rowIndex) ?? [];
      row[cell.columnIndex] = cell.content.trim();
      rows.set(cell.rowIndex, row);
    }

    const rowValues = [...rows.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, values]) => values.filter(Boolean));

    if (rowValues.length < 2) {
      continue;
    }

    const header = rowValues[0].join(" ").toLowerCase();
    const bodyRows = rowValues.slice(1);

    if (/experience|employment|work/.test(header)) {
      for (const row of bodyRows) {
        employmentHistory.push({
          role: row[0],
          company: row[1],
          startDate: row[2],
          endDate: row[3],
          location: row[4],
        });
      }
      continue;
    }

    if (/education|degree|school|university/.test(header)) {
      for (const row of bodyRows) {
        education.push({
          degree: row[0],
          institution: row[1],
          endDate: row[2],
          fieldOfStudy: row[3],
        });
      }
    }
  }

  return { employmentHistory, education };
}

function inferName(content: string, email?: string): string | undefined {
  const firstLine = content.split("\n").map((line) => line.trim()).find(Boolean);
  if (firstLine && firstLine.length < 80 && !firstLine.includes("@")) {
    return firstLine;
  }

  if (email) {
    const localPart = email.split("@")[0];
    return localPart
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return undefined;
}

export function mapAzureLayoutToCandidateCv(
  analysisResult: AnalyzeResult,
): CandidateCv {
  const content = normalizeWhitespace(analysisResult.content ?? "");
  const cv = createEmptyCandidateCv();

  if (!content) {
    return cv;
  }

  const email = extractEmail(content);
  const summary = extractSection(content, SECTION_ALIASES.summary);
  const skills = parseSkills(extractSection(content, SECTION_ALIASES.skills));
  const experienceSection = extractSection(content, SECTION_ALIASES.experience);
  const educationSection = extractSection(content, SECTION_ALIASES.education);
  const tableData = mapTablesToStructuredData(analysisResult.tables);

  cv.personalInformation = {
    fullName: inferName(content, email),
    email,
    phone: extractPhone(content),
    websites: extractWebsites(content),
  };
  cv.summary = summary;
  cv.skills = skills;
  cv.employmentHistory =
    tableData.employmentHistory.length > 0
      ? tableData.employmentHistory
      : parseEmploymentSection(experienceSection);
  cv.education =
    tableData.education.length > 0
      ? tableData.education
      : parseEducationSection(educationSection);
  cv.certifications = parseListItems(
    extractSection(content, SECTION_ALIASES.certifications),
  ).map((name) => ({ name }));
  cv.languages = parseListItems(
    extractSection(content, SECTION_ALIASES.languages),
  ).map((language) => ({ language }));
  cv.projects = parseListItems(
    extractSection(content, SECTION_ALIASES.projects),
  ).map((name) => ({ name }));

  return cv;
}
