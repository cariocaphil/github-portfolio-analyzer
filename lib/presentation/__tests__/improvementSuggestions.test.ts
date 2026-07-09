import { describe, expect, it } from "vitest";
import { consolidateImprovementSuggestions } from "../improvementSuggestions";
import type { DeveloperPortfolioReport } from "@/lib/models/report";

function createReport(
  suggestions: string[],
  sections: DeveloperPortfolioReport["sections"] = [],
): DeveloperPortfolioReport {
  return {
    developerSnapshot: {
      username: "dev-user",
      name: "Dev User",
      bio: null,
      totalRepositories: 6,
      primaryLanguages: ["TypeScript"],
      accountCreated: "2021-01-01T00:00:00Z",
      profileUrl: "https://github.com/dev-user",
    },
    sections,
    improvementSuggestions: suggestions,
    metadata: {
      analysisSource: "mock",
      generationTimestamp: new Date().toISOString(),
    },
  };
}

describe("consolidateImprovementSuggestions", () => {
  it("merges overlapping testing recommendations into one theme", () => {
    const report = createReport([
      "Add more tests across repositories.",
      "Increase testing coverage in active projects.",
      "Adopt Testing Library in projects that already use React.",
      "Introduce GitHub Actions for CI on key repositories.",
      "Add Dockerfiles where deployment evidence is missing.",
    ]);

    const consolidated = consolidateImprovementSuggestions(report);

    expect(consolidated.length).toBeLessThanOrEqual(5);
    expect(consolidated.length).toBeGreaterThanOrEqual(2);
    expect(
      consolidated.filter((item) => item.startsWith("Testing & Quality:")),
    ).toHaveLength(1);
    expect(
      consolidated.some((item) => item.startsWith("CI / Automation:")),
    ).toBe(true);
  });

  it("orders higher-impact themes before lower-impact themes", () => {
    const report = createReport([
      "Improve README documentation on older repositories.",
      "Add topics and descriptions to improve discoverability.",
      "Increase automated testing coverage.",
      "Introduce GitHub Actions workflows.",
    ]);

    const consolidated = consolidateImprovementSuggestions(report);
    const testingIndex = consolidated.findIndex((item) =>
      item.startsWith("Testing & Quality:"),
    );
    const ciIndex = consolidated.findIndex((item) =>
      item.startsWith("CI / Automation:"),
    );
    const documentationIndex = consolidated.findIndex((item) =>
      item.startsWith("Documentation:"),
    );

    expect(testingIndex).toBeGreaterThanOrEqual(0);
    expect(ciIndex).toBeGreaterThan(testingIndex);
    expect(documentationIndex).toBeGreaterThan(ciIndex);
  });

  it("includes observable evidence when a matching gap exists in lens sections", () => {
    const report = createReport(
      ["Add CI workflows to more repositories.", "Automate build checks with GitHub Actions."],
      [
        {
          lensId: "project-complexity",
          title: "Project Complexity",
          guidingQuestion: "How sophisticated is the portfolio?",
          observations: [
            {
              observation: "Limited CI evidence across multiple repositories.",
              rationale: "Few workflow files were observed.",
              confidence: "medium",
              supportingEvidence: [],
            },
          ],
        },
      ],
    );

    const consolidated = consolidateImprovementSuggestions(report);
    expect(consolidated).toHaveLength(1);
    expect(consolidated[0]).toContain("CI / Automation:");
    expect(consolidated[0]).toContain("Evidence: Limited CI evidence");
  });
});
