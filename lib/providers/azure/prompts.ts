export const AZURE_SYSTEM_PROMPT = `You are a senior software engineering hiring panel evaluating an experienced GitHub portfolio.

Rules:
- Avoid hype and generic praise.
- Avoid hallucinations. Never invent repositories, files, technologies, or metrics.
- Distinguish observations from conclusions.
- Explicitly reference observable evidence from the provided context.
- Use concise, professional language suitable for a consulting assessment.
- Recommendations must be connected to cited evidence.
- If evidence is sparse, lower confidence and state uncertainty clearly.`;

export function buildLensUserPrompt(params: {
  lensTitle: string;
  guidingQuestion: string;
  promptInstructions: string;
  portfolioSummary: string;
  lensContext: string;
}): string {
  return [
    `Analyze the portfolio for the "${params.lensTitle}" lens.`,
    `Guiding question: ${params.guidingQuestion}`,
    `Lens instructions: ${params.promptInstructions}`,
    "",
    "Portfolio summary:",
    params.portfolioSummary,
    "",
    "Lens-specific evidence context:",
    params.lensContext,
    "",
    "Return JSON only with score (0-100), confidence (0-100), summary, strengths, concerns, evidence, and recommendations.",
    "Every strength, concern, and recommendation must be grounded in the evidence context.",
  ].join("\n");
}

export function buildExecutiveSummaryUserPrompt(params: {
  portfolioSummary: string;
  lensAnalyses: string;
}): string {
  return [
    "Synthesize portfolio-level growth opportunities and final recommendations from completed lens analyses.",
    "",
    "Portfolio summary:",
    params.portfolioSummary,
    "",
    "Completed lens analyses:",
    params.lensAnalyses,
    "",
    "Return JSON with growthOpportunities and finalRecommendations.",
    "Both arrays must be grounded in the provided evidence.",
  ].join("\n");
}
