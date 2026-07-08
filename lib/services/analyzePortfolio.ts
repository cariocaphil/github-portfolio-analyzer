import { aggregatePortfolioEvidence } from "@/lib/analysis/portfolio/aggregator";
import { analyzeRepositories } from "@/lib/analysis/repository/pipeline";
import { generatePortfolioReport } from "@/lib/azureOpenAI";
import { fetchGitHubPortfolio } from "@/lib/github/evidenceProvider";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import { GitHubRateLimitError } from "@/lib/github/client";

export async function analyzeGitHubPortfolio(
  username: string,
): Promise<DeveloperPortfolioReport> {
  const portfolio = await fetchGitHubPortfolio(username);
  const repositoryProfiles = analyzeRepositories(portfolio.repositories);
  const unifiedEvidence = aggregatePortfolioEvidence(
    portfolio,
    repositoryProfiles,
  );
  return generatePortfolioReport(unifiedEvidence);
}

export function formatAnalysisError(error: unknown): string {
  if (error instanceof GitHubRateLimitError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred while analyzing the portfolio.";
}
