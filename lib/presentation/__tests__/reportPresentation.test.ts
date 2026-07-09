import { describe, expect, it } from "vitest";
import { categorizeTechnologies } from "../reportPresentation";
import type { DeveloperPortfolioReport } from "@/lib/models/report";

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
