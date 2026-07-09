import { describe, expect, it } from "vitest";
import type { AnalyzeResult } from "@azure/ai-form-recognizer";
import { mapAzureResumeToCandidateCv } from "@/lib/azure/cvMapper";
import { buildCvExtractionSummary } from "@/lib/cv/buildCvExtractionSummary";

const azureResumeFixture: AnalyzeResult = {
  apiVersion: "2024-11-30",
  modelId: "prebuilt-resume",
  content: "Jane Doe resume",
  pages: [{ pageNumber: 1, angle: 0, width: 100, height: 100, unit: "pixel", spans: [] }],
  documents: [
    {
      docType: "resume",
      confidence: 0.95,
      spans: [],
      fields: {
        CandidateName: {
          kind: "string",
          value: "Jane Doe",
          content: "Jane Doe",
        },
        Email: {
          kind: "string",
          value: "jane@example.com",
          content: "jane@example.com",
        },
        Summary: {
          kind: "string",
          value: "Senior software engineer.",
          content: "Senior software engineer.",
        },
        Skills: {
          kind: "array",
          values: [
            { kind: "string", value: "TypeScript", content: "TypeScript" },
            { kind: "string", value: "React", content: "React" },
          ],
        },
        WorkExperience: {
          kind: "array",
          values: [
            {
              kind: "object",
              properties: {
                Company: { kind: "string", value: "Contoso", content: "Contoso" },
                Title: { kind: "string", value: "Engineer", content: "Engineer" },
                StartDate: { kind: "string", value: "2020-01", content: "2020-01" },
                EndDate: { kind: "string", value: "2024-06", content: "2024-06" },
              },
            },
          ],
        },
        Education: {
          kind: "array",
          values: [
            {
              kind: "object",
              properties: {
                School: { kind: "string", value: "State University", content: "State University" },
                Degree: { kind: "string", value: "BSc", content: "BSc" },
                Major: { kind: "string", value: "Computer Science", content: "Computer Science" },
              },
            },
          ],
        },
        Certifications: {
          kind: "array",
          values: [
            {
              kind: "object",
              properties: {
                Name: { kind: "string", value: "Azure Developer", content: "Azure Developer" },
              },
            },
          ],
        },
        Languages: {
          kind: "array",
          values: [
            {
              kind: "object",
              properties: {
                Language: { kind: "string", value: "English", content: "English" },
                Proficiency: { kind: "string", value: "Native", content: "Native" },
              },
            },
          ],
        },
        Projects: {
          kind: "array",
          values: [
            {
              kind: "object",
              properties: {
                Name: { kind: "string", value: "Portfolio Analyzer", content: "Portfolio Analyzer" },
              },
            },
          ],
        },
      },
    },
  ],
};

describe("mapAzureResumeToCandidateCv", () => {
  it("maps Azure resume fields into CandidateCv", () => {
    const candidateCv = mapAzureResumeToCandidateCv(azureResumeFixture);

    expect(candidateCv.personalInformation.fullName).toBe("Jane Doe");
    expect(candidateCv.personalInformation.email).toBe("jane@example.com");
    expect(candidateCv.summary).toBe("Senior software engineer.");
    expect(candidateCv.skills).toEqual(["TypeScript", "React"]);
    expect(candidateCv.employmentHistory[0]).toMatchObject({
      company: "Contoso",
      role: "Engineer",
    });
    expect(candidateCv.education[0]).toMatchObject({
      institution: "State University",
      degree: "BSc",
      fieldOfStudy: "Computer Science",
    });
    expect(candidateCv.certifications[0]?.name).toBe("Azure Developer");
    expect(candidateCv.languages[0]).toMatchObject({
      language: "English",
      proficiency: "Native",
    });
    expect(candidateCv.projects[0]?.name).toBe("Portfolio Analyzer");
  });

  it("returns an empty CandidateCv when no documents are present", () => {
    const candidateCv = mapAzureResumeToCandidateCv({
      apiVersion: "2024-11-30",
      modelId: "prebuilt-resume",
      content: "",
    });

    expect(candidateCv.skills).toEqual([]);
    expect(candidateCv.employmentHistory).toEqual([]);
  });
});

describe("buildCvExtractionSummary", () => {
  it("builds extraction counts from CandidateCv", () => {
    const candidateCv = mapAzureResumeToCandidateCv(azureResumeFixture);

    expect(buildCvExtractionSummary(candidateCv)).toEqual({
      skills: 2,
      employmentHistory: 1,
      education: 1,
      certifications: 1,
      languages: 1,
      projects: 1,
    });
  });
});
