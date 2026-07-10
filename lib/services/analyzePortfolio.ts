import type { CandidateEvidenceModel } from "@/domain/candidateEvidence";
import { aggregatePortfolioEvidence } from "@/lib/analysis/portfolio/aggregator";
import { analyzeRepositories } from "@/lib/analysis/repository/pipeline";
import { fetchGitHubPortfolio } from "@/lib/github/evidenceProvider";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import { getPortfolioAnalysisProvider } from "@/lib/providers/PortfolioAnalysisProviderFactory";
import {
  runCvPortfolioAlignmentStep,
  type CvAlignmentInput,
} from "@/lib/services/cvPortfolioAlignmentStep";

export interface AnalyzePortfolioOptions extends CvAlignmentInput {}

export async function analyzeGitHubPortfolio(
  username: string,
  options?: AnalyzePortfolioOptions,
): Promise<DeveloperPortfolioReport> {
  const portfolio = await fetchGitHubPortfolio(username);
  const repositoryProfiles = analyzeRepositories(portfolio.repositories);
  const unifiedEvidence = aggregatePortfolioEvidence(
    portfolio,
    repositoryProfiles,
  );

  const provider = getPortfolioAnalysisProvider();
  const report = await provider.analyzePortfolio(unifiedEvidence);
  const alignmentResult = await runCvPortfolioAlignmentStep(
    report,
    unifiedEvidence,
    options,
  );

  return alignmentResult.report;
}
