import { describe, expect, it } from "vitest";
import {
  buildPortfolioContextCache,
  buildPortfolioSummaryMarkdown,
  buildRepositoryContext,
} from "../portfolioContextBuilder";
import { createSampleEvidence } from "./fixtures";

describe("portfolioContextBuilder", () => {
  it("builds markdown repository context without raw JSON", () => {
    const evidence = createSampleEvidence();
    const context = buildRepositoryContext(evidence.repositoryProfiles[0]);

    expect(context.markdown).toContain("# Repository");
    expect(context.markdown).toContain("Name: dev-user/app");
    expect(context.markdown).toContain("Main Technologies:");
    expect(context.markdown).not.toContain('"repositoryProfiles"');
  });

  it("caches repository contexts for reuse", () => {
    const evidence = createSampleEvidence();
    const cache = buildPortfolioContextCache(evidence);

    expect(cache.size).toBe(1);
    expect(cache.get("dev-user/app")?.repository).toBe("dev-user/app");
  });

  it("builds portfolio summary markdown", () => {
    const evidence = createSampleEvidence();
    const summary = buildPortfolioSummaryMarkdown(evidence);

    expect(summary).toContain("Developer: dev-user");
    expect(summary).toContain("Repositories analyzed: 1");
  });
});
