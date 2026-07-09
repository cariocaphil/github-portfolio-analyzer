import { describe, expect, it } from "vitest";
import { getPortfolioLenses } from "@/config/analysisLenses";
import { buildLensContextMarkdown } from "../lensContextMapper";
import { buildPortfolioContextCache } from "../portfolioContextBuilder";
import { createSampleEvidence } from "./fixtures";

describe("lensContextMapper", () => {
  it("filters context for project evolution lens", () => {
    const evidence = createSampleEvidence();
    const lens = getPortfolioLenses().find((item) => item.id === "project-evolution");
    expect(lens).toBeDefined();

    const markdown = buildLensContextMarkdown({
      lens: lens!,
      evidence,
      repositoryContexts: buildPortfolioContextCache(evidence),
    });

    expect(markdown).toContain("dev-user/app");
    expect(markdown.toLowerCase()).toContain("activity");
    expect(markdown).not.toContain("dependency: react");
  });

  it("filters context for technical breadth lens", () => {
    const evidence = createSampleEvidence();
    const lens = getPortfolioLenses().find((item) => item.id === "technical-breadth");
    expect(lens).toBeDefined();

    const markdown = buildLensContextMarkdown({
      lens: lens!,
      evidence,
      repositoryContexts: buildPortfolioContextCache(evidence),
    });

    expect(markdown).toContain("Uses React and TypeScript");
  });
});
