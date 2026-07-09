import { describe, expect, it } from "vitest";
import {
  categorizeTechnologies,
  getDistinctKeyFindings,
} from "../reportPresentation";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import type { ReportSection } from "@/lib/models/report";

describe("categorizeTechnologies", () => {
  it("prefers cleaned aggregated technologies over noisy evidence facts", () => {
    const report: DeveloperPortfolioReport = {
      developerSnapshot: {
        username: "dev-user",
        name: "Dev User",
        bio: null,
        totalRepositories: 1,
        primaryLanguages: ["TypeScript"],
        accountCreated: "2021-01-01T00:00:00Z",
        profileUrl: "https://github.com/dev-user",
      },
      sections: [],
      improvementSuggestions: [],
      metadata: {
        analysisSource: "mock",
        generationTimestamp: new Date().toISOString(),
        aggregatedTechnologies: [
          "react",
          "node",
          "github actions",
          "Repositories with CI",
          "README.md",
          "24",
          "supabase",
        ],
      },
    };

    const grouped = categorizeTechnologies(report);
    const all = grouped.flatMap((group) => group.technologies);

    expect(all).toContain("React");
    expect(all).toContain("Node.js");
    expect(all).toContain("GitHub Actions");
    expect(all).toContain("Supabase");
    expect(all).toContain("TypeScript");
    expect(all).not.toContain("Repositories with CI");
    expect(all).not.toContain("README.md");
    expect(all).not.toContain("24");
  });
});

describe("getDistinctKeyFindings", () => {
  it("removes exact duplicate of section summary", () => {
    const section: ReportSection = {
      lensId: "technical-breadth",
      title: "Technical Breadth",
      guidingQuestion: "What technologies are demonstrated?",
      observations: [
        {
          observation:
            "Strong frontend depth across React and TypeScript with consistent repository evidence.",
          rationale: "Summary rationale",
          confidence: "high",
          supportingEvidence: [],
        },
        {
          observation:
            "Strong frontend depth across React and TypeScript with consistent repository evidence.",
          rationale: "Duplicate finding rationale",
          confidence: "high",
          supportingEvidence: [],
        },
        {
          observation: "CI and Docker evidence are present in multiple repositories.",
          rationale: "Specific signal rationale",
          confidence: "medium",
          supportingEvidence: [],
        },
      ],
    };

    const findings = getDistinctKeyFindings(
      section,
      section.observations[0].observation,
      3,
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].observation).toContain("CI and Docker evidence");
  });

  it("removes near-identical long finding while preserving specific short finding", () => {
    const summary =
      "The portfolio demonstrates strong frontend breadth with React, TypeScript, and modern delivery tooling across projects.";
    const section: ReportSection = {
      lensId: "project-complexity",
      title: "Project Complexity",
      guidingQuestion: "How sophisticated are the projects?",
      observations: [
        {
          observation: summary,
          rationale: "Summary rationale",
          confidence: "high",
          supportingEvidence: [],
        },
        {
          observation:
            "The portfolio demonstrates strong frontend breadth with React TypeScript and modern delivery tooling across multiple projects.",
          rationale: "Near-duplicate",
          confidence: "high",
          supportingEvidence: [],
        },
        {
          observation: "Dockerfiles appear in two repositories.",
          rationale: "Specific evidence",
          confidence: "medium",
          supportingEvidence: [],
        },
      ],
    };

    const findings = getDistinctKeyFindings(section, summary, 3);
    expect(findings).toHaveLength(1);
    expect(findings[0].observation).toBe("Dockerfiles appear in two repositories.");
  });
});
