import { describe, expect, it } from "vitest";
import { mapCvNormalizationResponseToCandidateEvidence } from "@/lib/azure/cvNormalizerMapper";
import type { CvNormalizationModelResponse } from "@/lib/azure/cvNormalizerSchema";

const responseFixture: CvNormalizationModelResponse = {
  personalInformation: {
    confidence: 0.92,
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "",
    location: "Paris",
    websites: ["https://github.com/janedoe"],
  },
  executiveSummary: {
    confidence: 0.88,
    text: "Senior software engineer.",
  },
  skills: {
    confidence: 0.9,
    entries: ["ReactJS", "JS", "TS", "React.js", "Node.js"],
  },
  employmentHistory: {
    confidence: 0.93,
    entries: [
      {
        company: "Contoso",
        role: "Senior Engineer",
        startDate: "04/2022",
        endDate: "2024-06",
        description: "Built platform services.",
        location: "Remote",
      },
    ],
  },
  education: {
    confidence: 0.87,
    entries: [
      {
        institution: "State University",
        degree: "BSc",
        fieldOfStudy: "Computer Science",
        startDate: "",
        endDate: "2019",
      },
    ],
  },
  certifications: {
    confidence: 0.8,
    entries: [
      {
        name: "Azure Developer",
        issuer: "Microsoft",
        date: "2023-05",
      },
    ],
  },
  projects: {
    confidence: 0.75,
    entries: [
      {
        name: "Portfolio Analyzer",
        description: "Evidence-based portfolio analysis.",
        link: "",
        technologies: ["Next.js", "TS"],
      },
    ],
  },
  languages: {
    confidence: 0.84,
    entries: [
      {
        language: "English",
        proficiency: "Native",
      },
    ],
  },
};

describe("mapCvNormalizationResponseToCandidateEvidence", () => {
  it("normalizes technologies, dates, and confidence values", () => {
    const candidateEvidence =
      mapCvNormalizationResponseToCandidateEvidence(responseFixture);

    expect(candidateEvidence.personalInformation.fullName).toBe("Jane Doe");
    expect(candidateEvidence.skills.entries).toEqual([
      "JavaScript",
      "Node.js",
      "React",
      "TypeScript",
    ]);
    expect(candidateEvidence.employmentHistory.entries[0]).toMatchObject({
      company: "Contoso",
      role: "Senior Engineer",
      startDate: "2022-04",
      endDate: "2024-06",
    });
    expect(candidateEvidence.education.entries[0]?.endDate).toBe("2019-01");
    expect(candidateEvidence.projects.entries[0]?.technologies).toEqual([
      "Next.js",
      "TypeScript",
    ]);
    expect(candidateEvidence.employmentHistory.confidence).toBe(0.93);
  });

  it("drops empty structured entries", () => {
    const candidateEvidence = mapCvNormalizationResponseToCandidateEvidence({
      ...responseFixture,
      employmentHistory: {
        confidence: 0.2,
        entries: [
          {
            company: "",
            role: "",
            startDate: "",
            endDate: "",
            description: "",
            location: "",
          },
        ],
      },
    });

    expect(candidateEvidence.employmentHistory.entries).toEqual([]);
  });
});
