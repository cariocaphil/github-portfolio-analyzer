import { describe, expect, it } from "vitest";
import {
  PORTFOLIO_ANALYSIS_LENSES,
  getPortfolioLenses,
} from "@/config/analysisLenses";
import { buildLensContextMarkdown } from "../lensContextMapper";
import { createSampleEvidence } from "./fixtures";

describe("lensContextMapper", () => {
  it("filters context for project evolution lens", () => {
    const evidence = createSampleEvidence();
    const lens = PORTFOLIO_ANALYSIS_LENSES.find(
      (item) => item.id === "project-evolution",
    );
    expect(lens).toBeDefined();

    const markdown = buildLensContextMarkdown({
      lens: lens!,
      evidence,
    });

    expect(markdown).toContain("dev-user/app");
    expect(markdown.toLowerCase()).toContain("days since last push");
    expect(markdown).not.toContain("dependency: react");
  });

  it("filters context for technical breadth lens", () => {
    const evidence = createSampleEvidence();
    const lens = getPortfolioLenses().find((item) => item.id === "technical-breadth");
    expect(lens).toBeDefined();

    const markdown = buildLensContextMarkdown({
      lens: lens!,
      evidence,
    });

    expect(markdown).toContain("Uses React and TypeScript");
    expect(markdown).not.toContain("Important README excerpt:");
    expect(markdown).not.toContain("Stars/Forks:");
  });
});
