import { ProviderConfigurationError } from "@/lib/errors/ProviderConfigurationError";
import type { UnifiedPortfolioEvidenceModel } from "@/lib/models/portfolio";
import type { DeveloperPortfolioReport } from "@/lib/models/report";
import type { PortfolioAnalysisProvider } from "./PortfolioAnalysisProvider";

const PROVIDER_NAME = "AzureOpenAIAnalysisProvider";

/**
 * Placeholder for future Azure OpenAI Structured Outputs integration.
 *
 * Example future call shape:
 *
 * ```ts
 * const completion = await client.chat.completions.create({
 *   model: process.env.AZURE_OPENAI_DEPLOYMENT!,
 *   response_format: zodResponseFormat(reportSectionSchema, "report_section"),
 *   messages: [
 *     { role: "system", content: PORTFOLIO_ANALYSIS_SYSTEM_PROMPT },
 *     { role: "user", content: buildLensPrompt(lens, portfolioEvidence) },
 *   ],
 * });
 * return completion.choices[0].message.parsed;
 * ```
 */
export class AzureOpenAIAnalysisProvider implements PortfolioAnalysisProvider {
  async analyzePortfolio(
    _evidence: UnifiedPortfolioEvidenceModel,
  ): Promise<DeveloperPortfolioReport> {
    throw new ProviderConfigurationError(
      "Azure OpenAI portfolio analysis is not yet implemented. Configure AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT to enable this provider in a future release.",
      PROVIDER_NAME,
    );
  }
}
