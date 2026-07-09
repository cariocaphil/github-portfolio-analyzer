import { describe, expect, it } from "vitest";
import { MockPortfolioAnalysisProvider } from "../MockPortfolioAnalysisProvider";
import { createSampleEvidence } from "../azure/__tests__/fixtures";

describe("MockPortfolioAnalysisProvider", () => {
  it("produces deterministic report sections and mock metadata", async () => {
    const provider = new MockPortfolioAnalysisProvider();
    const evidence = createSampleEvidence();

    const report = await provider.analyzePortfolio(evidence);

    expect(report.sections.length).toBe(7);
    expect(report.metadata.analysisSource).toBe("mock");
    expect(report.metadata.providerName).toBe("MockPortfolioAnalysisProvider");
    expect(report.developerSnapshot.username).toBe("dev-user");
    expect(report.sections[0].observations.length).toBeGreaterThan(0);
  });
});
