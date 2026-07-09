import { aggregatePortfolioEvidence } from "@/lib/analysis/portfolio/aggregator";
import { analyzeRepositories } from "@/lib/analysis/repository/pipeline";
import { ProviderAnalysisError } from "@/lib/errors/ProviderAnalysisError";
import { ProviderConfigurationError } from "@/lib/errors/ProviderConfigurationError";
import { ProviderExecutionError } from "@/lib/errors/ProviderExecutionError";
import { ProviderUnavailableError } from "@/lib/errors/ProviderUnavailableError";
import { UnsupportedProviderError } from "@/lib/errors/UnsupportedProviderError";
import { fetchGitHubPortfolio } from "@/lib/github/evidenceProvider";
import { GitHubRateLimitError } from "@/lib/github/client";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import { getPortfolioAnalysisProvider } from "@/lib/providers/PortfolioAnalysisProviderFactory";

export async function analyzeGitHubPortfolio(
  username: string,
): Promise<DeveloperPortfolioReport> {
  const portfolio = await fetchGitHubPortfolio(username);
  const repositoryProfiles = analyzeRepositories(portfolio.repositories);
  const unifiedEvidence = aggregatePortfolioEvidence(
    portfolio,
    repositoryProfiles,
  );

  const provider = getPortfolioAnalysisProvider();
  return provider.analyzePortfolio(unifiedEvidence);
}

export function formatAnalysisError(error: unknown): string {
  if (error instanceof GitHubRateLimitError) {
    return error.message;
  }

  if (error instanceof UnsupportedProviderError) {
    return error.message;
  }

  if (error instanceof ProviderConfigurationError) {
    return error.message;
  }

  if (error instanceof ProviderUnavailableError) {
    return error.message;
  }

  if (error instanceof ProviderExecutionError) {
    return error.message;
  }

  if (error instanceof ProviderAnalysisError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred while analyzing the portfolio.";
}
