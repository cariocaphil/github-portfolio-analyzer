import type { EvidenceSource } from "@/lib/models/evidence";
import type {
  DeveloperPortfolioReport,
  ReportObservation,
  ReportSection,
} from "@/lib/models/report";
import { normalizeTechnologyName } from "@/lib/technology/normalization";

export type ConfidenceLevel = ReportObservation["confidence"];

export interface ScoredSection {
  section: ReportSection;
  score: number;
  summary: string;
}

export interface GroupedEvidenceItem {
  evidence: EvidenceSource;
  observations: ReportObservation[];
}

export interface RepositoryEvidenceGroup {
  repository: string;
  evidenceCount: number;
  primaryTechnologies: string[];
  repositoryPurpose: string;
  keyAchievements: string[];
  items: GroupedEvidenceItem[];
}

export interface ExecutiveSummaryViewModel {
  overallPortfolioScore: number;
  strengthSummary: string;
  primaryTechnicalDomains: string[];
  seniorityEstimate: string;
  aiReadiness: string;
  recommendedCareerPositioning: string;
}

export interface TechnologyCategoryGroup {
  category: string;
  technologies: string[];
}

const SCORE_BY_CONFIDENCE: Record<ConfidenceLevel, number> = {
  high: 90,
  medium: 70,
  low: 50,
};

const TECHNOLOGY_CATEGORY_RULES: Record<string, string[]> = {
  Frontend: [
    "react",
    "next.js",
    "next",
    "vue",
    "angular",
    "svelte",
    "typescript",
    "javascript",
    "material ui",
    "tailwind",
    "redux",
  ],
  Backend: [
    "node",
    "node.js",
    "express",
    "fastapi",
    "django",
    "flask",
    "spring",
    "go",
    "gin",
    "nestjs",
    "python",
  ],
  Testing: [
    "jest",
    "vitest",
    "playwright",
    "cypress",
    "pytest",
    "mocha",
    "chai",
    "testing-library",
    "rspec",
  ],
  Cloud: [
    "azure",
    "aws",
    "gcp",
    "railway",
    "vercel",
    "netlify",
    "cloudflare",
    "render",
    "firebase",
  ],
  "AI / LLM": [
    "openai",
    "azure openai",
    "langchain",
    "huggingface",
    "anthropic",
    "llamaindex",
    "ollama",
  ],
  Databases: [
    "postgres",
    "postgresql",
    "supabase",
    "mysql",
    "sqlite",
    "mongodb",
    "redis",
    "prisma",
  ],
  DevOps: [
    "docker",
    "github actions",
    "kubernetes",
    "terraform",
    "helm",
    "ansible",
    "ci",
    "cd",
  ],
};

function confidenceScore(observations: ReportObservation[]): number {
  if (observations.length === 0) {
    return 0;
  }

  const total = observations.reduce((sum, observation) => {
    return sum + SCORE_BY_CONFIDENCE[observation.confidence];
  }, 0);

  return Math.round(total / observations.length);
}

export function toSectionSummary(section: ReportSection): ScoredSection {
  const summary =
    section.observations[0]?.observation ?? "No observations provided.";
  return {
    section,
    score: confidenceScore(section.observations),
    summary,
  };
}

export function slugFromLensId(lensId: string): string {
  return `lens-${lensId}`;
}

function normalizeTechnology(token: string): string {
  return token.trim().replace(/\s+/g, " ");
}

function classifyTechnology(technology: string): string {
  const lower = technology.toLowerCase();
  for (const [category, rules] of Object.entries(TECHNOLOGY_CATEGORY_RULES)) {
    if (rules.some((rule) => lower.includes(rule))) {
      return category;
    }
  }
  return "General Utilities";
}

export function categorizeTechnologies(
  report: DeveloperPortfolioReport,
): TechnologyCategoryGroup[] {
  const allTokens = new Set<string>();

  const metadataTechnologies = report.metadata.aggregatedTechnologies ?? [];
  for (const technology of metadataTechnologies) {
    const normalized = normalizeTechnologyName(technology);
    if (normalized) {
      allTokens.add(normalized);
    }
  }

  for (const language of report.developerSnapshot.primaryLanguages) {
    const normalized = normalizeTechnologyName(language);
    if (normalized) {
      allTokens.add(normalized);
    }
  }

  // Backward-compatible fallback for old reports without aggregated technologies.
  if (allTokens.size === 0) {
    for (const section of report.sections) {
      for (const observation of section.observations) {
        for (const evidence of observation.supportingEvidence) {
          for (const fact of evidence.facts) {
            const tokens = fact
              .split(/[,:]/)
              .map(normalizeTechnology)
              .filter((token) => token.length > 1 && token.length < 40);
            for (const token of tokens) {
              const normalized = normalizeTechnologyName(token);
              if (normalized) {
                allTokens.add(normalized);
              }
            }
          }
        }
      }
    }
  }

  const grouped = new Map<string, Set<string>>();
  for (const token of allTokens) {
    const category = classifyTechnology(token);
    if (!grouped.has(category)) {
      grouped.set(category, new Set<string>());
    }
    grouped.get(category)?.add(token);
  }

  return [...grouped.entries()]
    .map(([category, values]) => ({
      category,
      technologies: [...values].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

function extractRepositoryPurpose(observations: ReportObservation[]): string {
  const observation = observations.find((item) =>
    item.observation.toLowerCase().includes("repository"),
  );
  return observation?.observation ?? "Purpose inferred from available evidence.";
}

function inferPrimaryTechnologies(items: GroupedEvidenceItem[]): string[] {
  const technologies = new Set<string>();
  for (const item of items) {
    const combined = [item.evidence.description, ...item.evidence.facts]
      .join(" ")
      .toLowerCase();

    for (const terms of Object.values(TECHNOLOGY_CATEGORY_RULES)) {
      for (const term of terms) {
        if (combined.includes(term)) {
          technologies.add(
            term
              .split(" ")
              .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
              .join(" "),
          );
        }
      }
    }
  }

  return [...technologies].slice(0, 6);
}

export function groupEvidenceByRepository(
  section: ReportSection,
): RepositoryEvidenceGroup[] {
  const byRepository = new Map<string, GroupedEvidenceItem[]>();

  for (const observation of section.observations) {
    for (const evidence of observation.supportingEvidence) {
      const repository = evidence.repository || "Unknown repository";
      if (!byRepository.has(repository)) {
        byRepository.set(repository, []);
      }

      const existing = byRepository.get(repository)?.find((item) => {
        return item.evidence.id === evidence.id;
      });

      if (existing) {
        existing.observations.push(observation);
      } else {
        byRepository.get(repository)?.push({
          evidence,
          observations: [observation],
        });
      }
    }
  }

  return [...byRepository.entries()]
    .map(([repository, items]) => {
      const flattenedObservations = items.flatMap((item) => item.observations);
      return {
        repository,
        evidenceCount: items.length,
        primaryTechnologies: inferPrimaryTechnologies(items),
        repositoryPurpose: extractRepositoryPurpose(flattenedObservations),
        keyAchievements: flattenedObservations
          .map((observation) => observation.observation)
          .slice(0, 3),
        items,
      };
    })
    .sort((a, b) => b.evidenceCount - a.evidenceCount);
}

export function buildExecutiveSummary(
  report: DeveloperPortfolioReport,
): ExecutiveSummaryViewModel {
  const scoredSections = report.sections.map(toSectionSummary);
  const scored = scoredSections.filter((entry) => entry.score > 0);
  const overallPortfolioScore =
    scored.length === 0
      ? 0
      : Math.round(
          scored.reduce((sum, section) => sum + section.score, 0) / scored.length,
        );

  const topStrength = [...scoredSections].sort((a, b) => b.score - a.score)[0];
  const strengthSummary = topStrength
    ? `${topStrength.section.title} is currently the strongest dimension in this report.`
    : "Insufficient observations to determine strengths.";

  const primaryTechnicalDomains = categorizeTechnologies(report)
    .slice(0, 3)
    .map((group) => group.category);

  let seniorityEstimate = "Emerging";
  if (overallPortfolioScore >= 85) {
    seniorityEstimate = "Senior";
  } else if (overallPortfolioScore >= 75) {
    seniorityEstimate = "Mid-level";
  }

  const aiSignals = categorizeTechnologies(report).find(
    (group) => group.category === "AI / LLM",
  );
  const aiReadiness =
    aiSignals && aiSignals.technologies.length > 0
      ? "Clear AI/LLM tooling signals are present."
      : "Limited direct AI/LLM tooling evidence was detected.";

  const recommendedCareerPositioning =
    primaryTechnicalDomains.length > 0
      ? `${primaryTechnicalDomains.join(" + ")} focused software engineer profile.`
      : "Generalist software engineer profile with mixed evidence.";

  return {
    overallPortfolioScore,
    strengthSummary,
    primaryTechnicalDomains,
    seniorityEstimate,
    aiReadiness,
    recommendedCareerPositioning,
  };
}

export function distributionFromSections(sections: ReportSection[]): Array<{
  label: string;
  value: number;
}> {
  return sections.map((section) => ({
    label: section.title,
    value: section.observations.length,
  }));
}
