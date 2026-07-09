import { randomUUID } from "crypto";
import type { EvidenceSource } from "@/lib/models/evidence";
import type { UnifiedPortfolioEvidenceModel } from "@/lib/models/portfolio";
import type {
  DeveloperPortfolioReport,
  ReportObservation,
  ReportSection,
} from "@/lib/models/report";
import type { AnalysisLens } from "@/lib/models/report";
import { clampConfidence, confidenceToLevel } from "./confidence";
import type {
  ExecutiveSummaryResult,
  LensAnalysisResult,
  LensEvidenceItem,
} from "./types";

function resolveEvidenceSources(
  evidenceItems: LensEvidenceItem[],
  knownSources: EvidenceSource[],
): EvidenceSource[] {
  return evidenceItems.map((item) => {
    const match = knownSources.find(
      (source) =>
        source.repository === item.repository && source.path === item.path,
    );

    if (match) {
      return match;
    }

    return {
      id: randomUUID(),
      repository: item.repository,
      path: item.path,
      description: item.description,
      facts: item.facts,
      githubUrl: item.githubUrl,
    };
  });
}

function toObservation(
  text: string,
  rationale: string,
  confidence: number,
  supportingEvidence: EvidenceSource[],
): ReportObservation {
  return {
    observation: text,
    rationale,
    confidence: confidenceToLevel(clampConfidence(confidence)),
    supportingEvidence,
  };
}

export function mapLensResultToSection(params: {
  lens: AnalysisLens;
  result: LensAnalysisResult;
  evidence: UnifiedPortfolioEvidenceModel;
}): ReportSection {
  const confidence = clampConfidence(params.result.confidence);
  const supportingEvidence = resolveEvidenceSources(
    params.result.evidence,
    params.evidence.evidenceSources,
  );

  const observations: ReportObservation[] = [
    toObservation(
      params.result.summary,
      `Lens score: ${clampConfidence(params.result.score)}. Summary synthesized from observable portfolio evidence.`,
      confidence,
      supportingEvidence,
    ),
  ];

  for (const strength of params.result.strengths) {
    observations.push(
      toObservation(
        strength,
        "Identified as a portfolio strength based on cited repository evidence.",
        confidence,
        supportingEvidence.slice(0, 3),
      ),
    );
  }

  for (const concern of params.result.concerns) {
    observations.push(
      toObservation(
        concern,
        "Identified as a concern or gap based on cited repository evidence.",
        Math.max(confidence - 10, 40),
        supportingEvidence.slice(0, 3),
      ),
    );
  }

  return {
    lensId: params.lens.id,
    title: params.lens.title,
    guidingQuestion: params.lens.guidingQuestion,
    observations,
  };
}

export function mapToDeveloperPortfolioReport(params: {
  evidence: UnifiedPortfolioEvidenceModel;
  lensResults: Array<{ lens: AnalysisLens; result: LensAnalysisResult }>;
  executiveSummary: ExecutiveSummaryResult;
}): Omit<DeveloperPortfolioReport, "metadata"> {
  const sections = params.lensResults.map(({ lens, result }) =>
    mapLensResultToSection({ lens, result, evidence: params.evidence }),
  );

  const improvementSuggestions = [
    ...params.executiveSummary.growthOpportunities,
    ...params.executiveSummary.finalRecommendations,
  ].filter((value, index, array) => array.indexOf(value) === index);

  return {
    developerSnapshot: {
      username: params.evidence.profile.username,
      name: params.evidence.profile.name,
      bio: params.evidence.profile.bio,
      totalRepositories: params.evidence.summary.totalRepositories,
      primaryLanguages: params.evidence.summary.primaryLanguages,
      accountCreated: params.evidence.profile.createdAt,
      profileUrl: params.evidence.profile.url,
    },
    sections,
    improvementSuggestions,
  };
}

export function formatLensAnalysesForExecutiveSummary(
  lensResults: Array<{ lens: AnalysisLens; result: LensAnalysisResult }>,
): string {
  return lensResults
    .map(({ lens, result }) =>
      [
        `### ${lens.title}`,
        `Score: ${clampConfidence(result.score)}`,
        `Confidence: ${clampConfidence(result.confidence)}`,
        `Summary: ${result.summary}`,
        `Strengths: ${result.strengths.join("; ") || "None"}`,
        `Concerns: ${result.concerns.join("; ") || "None"}`,
        `Recommendations: ${result.recommendations.join("; ") || "None"}`,
      ].join("\n"),
    )
    .join("\n\n");
}
