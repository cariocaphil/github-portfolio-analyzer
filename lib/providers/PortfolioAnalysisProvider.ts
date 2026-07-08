import type { UnifiedPortfolioEvidenceModel } from "@/lib/models/portfolio";
import type { DeveloperPortfolioReport } from "@/lib/models/report";

export interface PortfolioAnalysisProvider {
  analyzePortfolio(
    evidence: UnifiedPortfolioEvidenceModel,
  ): Promise<DeveloperPortfolioReport>;
}
