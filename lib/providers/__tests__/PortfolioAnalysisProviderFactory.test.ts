import { afterEach, describe, expect, it } from "vitest";
import { getPortfolioAnalysisProvider } from "../PortfolioAnalysisProviderFactory";
import { MockPortfolioAnalysisProvider } from "../MockPortfolioAnalysisProvider";
import { AzureOpenAIAnalysisProvider } from "../AzureOpenAIAnalysisProvider";
import { UnsupportedProviderError } from "@/lib/errors/UnsupportedProviderError";

describe("getPortfolioAnalysisProvider", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("falls back to mock when env var is missing", () => {
    delete process.env.PORTFOLIO_ANALYSIS_PROVIDER;
    const provider = getPortfolioAnalysisProvider();
    expect(provider).toBeInstanceOf(MockPortfolioAnalysisProvider);
  });

  it("returns azure provider when configured", () => {
    process.env.PORTFOLIO_ANALYSIS_PROVIDER = "azure-openai";
    const provider = getPortfolioAnalysisProvider();
    expect(provider).toBeInstanceOf(AzureOpenAIAnalysisProvider);
  });

  it("throws UnsupportedProviderError for unknown providers", () => {
    process.env.PORTFOLIO_ANALYSIS_PROVIDER = "unknown-provider";
    expect(() => getPortfolioAnalysisProvider()).toThrow(UnsupportedProviderError);
  });
});
