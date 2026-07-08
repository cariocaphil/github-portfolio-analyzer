import { UnsupportedProviderError } from "@/lib/errors/UnsupportedProviderError";
import { AzureOpenAIAnalysisProvider } from "./AzureOpenAIAnalysisProvider";
import { MockPortfolioAnalysisProvider } from "./MockPortfolioAnalysisProvider";
import type { PortfolioAnalysisProvider } from "./PortfolioAnalysisProvider";

export type PortfolioAnalysisProviderId = "mock" | "azure-openai";

function resolveProviderId(): PortfolioAnalysisProviderId {
  const configured = process.env.PORTFOLIO_ANALYSIS_PROVIDER?.trim();
  if (!configured) {
    return "mock";
  }
  return configured as PortfolioAnalysisProviderId;
}

export function getPortfolioAnalysisProvider(): PortfolioAnalysisProvider {
  const providerId = resolveProviderId();

  switch (providerId) {
    case "mock":
      return new MockPortfolioAnalysisProvider();
    case "azure-openai":
      return new AzureOpenAIAnalysisProvider();
    default:
      throw new UnsupportedProviderError(providerId);
  }
}
