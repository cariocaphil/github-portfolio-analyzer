import { describe, expect, it } from "vitest";
import type { AnalyzeResult } from "@azure/ai-form-recognizer";
import { mapAzureLayoutToCandidateCv } from "@/lib/azure/layoutCvMapper";

const layoutFixture: AnalyzeResult = {
  apiVersion: "2024-11-30",
  modelId: "prebuilt-layout",
  content: `Jane Doe
jane@example.com
+1 555 010 2000

Summary
Senior software engineer with full-stack delivery experience.

Skills
TypeScript, React, Azure, Node.js

Experience
Senior Engineer at Contoso (2020 - 2024)
Built portfolio analysis tooling.

Education
BSc Computer Science | State University | 2019

Languages
English (Native)
French (Professional)

Projects
Portfolio Analyzer`,
  pages: [{ pageNumber: 1, angle: 0, width: 100, height: 100, unit: "pixel", spans: [] }],
};

describe("mapAzureLayoutToCandidateCv", () => {
  it("extracts structured CV data from layout content", () => {
    const candidateCv = mapAzureLayoutToCandidateCv(layoutFixture);

    expect(candidateCv.personalInformation.fullName).toBe("Jane Doe");
    expect(candidateCv.personalInformation.email).toBe("jane@example.com");
    expect(candidateCv.summary).toContain("Senior software engineer");
    expect(candidateCv.skills).toEqual([
      "TypeScript",
      "React",
      "Azure",
      "Node.js",
    ]);
    expect(candidateCv.employmentHistory[0]).toMatchObject({
      role: "Senior Engineer",
      company: "Contoso",
      startDate: "2020 - 2024",
    });
    expect(candidateCv.education[0]).toMatchObject({
      degree: "BSc Computer Science",
      institution: "State University",
      endDate: "2019",
    });
    expect(candidateCv.languages[0]?.language).toBe("English (Native)");
    expect(candidateCv.projects[0]?.name).toBe("Portfolio Analyzer");
  });
});
