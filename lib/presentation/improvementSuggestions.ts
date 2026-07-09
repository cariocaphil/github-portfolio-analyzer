import type { DeveloperPortfolioReport } from "@/lib/models/report";

const MAX_SUGGESTIONS = 5;

interface ImprovementTheme {
  id: string;
  label: string;
  priority: number;
  keywords: string[];
  recommendation: string;
  evidenceKeywords: string[];
}

const IMPROVEMENT_THEMES: ImprovementTheme[] = [
  {
    id: "testing",
    label: "Testing & Quality",
    priority: 1,
    keywords: [
      "test",
      "testing",
      "quality",
      "coverage",
      "jest",
      "vitest",
      "playwright",
      "cypress",
      "pytest",
      "testing library",
    ],
    recommendation:
      "Expand automated testing across priority repositories, building on any existing test tooling already visible in the portfolio.",
    evidenceKeywords: ["test", "testing", "quality", "coverage"],
  },
  {
    id: "ci",
    label: "CI / Automation",
    priority: 2,
    keywords: [
      "ci",
      "cd",
      "github actions",
      "workflow",
      "automation",
      "pipeline",
      "build check",
    ],
    recommendation:
      "Adopt CI automation on representative repositories that currently lack visible workflow evidence.",
    evidenceKeywords: ["ci", "workflow", "automation", "github actions"],
  },
  {
    id: "deployment",
    label: "Deployment & Infrastructure",
    priority: 3,
    keywords: [
      "docker",
      "deploy",
      "deployment",
      "delivery",
      "container",
      "kubernetes",
      "infrastructure",
      "homepage",
      "publish",
    ],
    recommendation:
      "Add Docker and deployment artifacts where delivery evidence is limited, so projects demonstrate runnable outcomes.",
    evidenceKeywords: ["docker", "deploy", "delivery", "container", "homepage"],
  },
  {
    id: "documentation",
    label: "Documentation",
    priority: 4,
    keywords: [
      "readme",
      "documentation",
      "document",
      "explain",
      "onboarding",
      "setup guide",
    ],
    recommendation:
      "Improve README and setup documentation consistency so repositories explain purpose, usage, and contribution paths.",
    evidenceKeywords: ["readme", "documentation", "document"],
  },
  {
    id: "portfolio",
    label: "Portfolio Presentation",
    priority: 5,
    keywords: [
      "topic",
      "discoverability",
      "portfolio",
      "presentation",
      "profile",
      "description",
      "pin",
      "showcase",
    ],
    recommendation:
      "Improve repository discoverability through clearer descriptions, topics, and portfolio presentation choices.",
    evidenceKeywords: ["topic", "description", "readme", "portfolio"],
  },
  {
    id: "consolidation",
    label: "Project Consolidation",
    priority: 6,
    keywords: [
      "consolidat",
      "archive",
      "focus",
      "prioriti",
      "reduce",
      "merge",
      "duplicate",
    ],
    recommendation:
      "Consolidate or deprioritize low-signal repositories to strengthen the overall portfolio narrative.",
    evidenceKeywords: ["repository", "portfolio", "focus", "breadth"],
  },
  {
    id: "cloud",
    label: "Cloud / Backend Visibility",
    priority: 7,
    keywords: [
      "cloud",
      "backend",
      "azure",
      "aws",
      "gcp",
      "api",
      "server",
      "infra",
      "supabase",
    ],
    recommendation:
      "Increase visibility of cloud and backend engineering work through clearer public repository signals.",
    evidenceKeywords: ["cloud", "backend", "api", "azure", "aws", "deploy"],
  },
];

function normalizeComparableText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): Set<string> {
  return new Set(
    normalizeComparableText(value)
      .split(" ")
      .filter((token) => token.length > 2),
  );
}

function overlapRatio(left: string, right: string): number {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  if (rightTokens.size === 0) {
    return 0;
  }
  const overlap = [...rightTokens].filter((token) => leftTokens.has(token)).length;
  return overlap / rightTokens.size;
}

function classifySuggestion(text: string): ImprovementTheme | null {
  const lower = text.toLowerCase();
  let bestTheme: ImprovementTheme | null = null;
  let bestScore = 0;

  for (const theme of IMPROVEMENT_THEMES) {
    const score = theme.keywords.filter((keyword) => lower.includes(keyword)).length;
    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }

  return bestScore > 0 ? bestTheme : null;
}

function dedupeWithinCluster(items: string[]): string[] {
  const kept: string[] = [];

  for (const item of items) {
    const isDuplicate = kept.some(
      (existing) =>
        normalizeComparableText(existing) === normalizeComparableText(item) ||
        overlapRatio(existing, item) >= 0.75,
    );
    if (!isDuplicate) {
      kept.push(item);
    }
  }

  return kept;
}

function extractSpecificDetail(items: string[]): string | null {
  const detailPatterns = [
    /testing library/i,
    /github actions/i,
    /docker/i,
    /readme/i,
    /vitest/i,
    /jest/i,
    /playwright/i,
    /topics?/i,
    /azure/i,
    /aws/i,
    /supabase/i,
  ];

  for (const pattern of detailPatterns) {
    const match = items.find((item) => pattern.test(item));
    if (match) {
      const snippet = match.match(pattern)?.[0];
      if (snippet) {
        return snippet;
      }
    }
  }

  const longest = [...items].sort((a, b) => b.length - a.length)[0];
  if (longest && longest.length <= 120) {
    return null;
  }

  return null;
}

function findEvidenceObservation(
  report: DeveloperPortfolioReport,
  theme: ImprovementTheme,
): string | null {
  for (const section of report.sections) {
    for (const observation of section.observations) {
      const lower = observation.observation.toLowerCase();
      if (
        theme.evidenceKeywords.some((keyword) => lower.includes(keyword)) &&
        (lower.includes("limited") ||
          lower.includes("gap") ||
          lower.includes("lack") ||
          lower.includes("few") ||
          lower.includes("without") ||
          lower.includes("no visible") ||
          lower.includes("not consistently") ||
          lower.includes("uneven"))
      ) {
        return observation.observation;
      }
    }
  }

  for (const section of report.sections) {
    for (const observation of section.observations) {
      const lower = observation.observation.toLowerCase();
      if (theme.evidenceKeywords.some((keyword) => lower.includes(keyword))) {
        return observation.observation;
      }
    }
  }

  return null;
}

function buildConsolidatedSuggestion(
  theme: ImprovementTheme,
  clusterItems: string[],
  report: DeveloperPortfolioReport,
): string {
  const detail = extractSpecificDetail(clusterItems);
  let recommendation = theme.recommendation;

  if (detail) {
    const normalizedDetail = detail.toLowerCase();
    if (!recommendation.toLowerCase().includes(normalizedDetail)) {
      recommendation = `${recommendation} (${detail} already appears in parts of the portfolio.)`;
    }
  }

  const evidence = findEvidenceObservation(report, theme);
  if (evidence) {
    return `${theme.label}: ${recommendation} Evidence: ${evidence}`;
  }

  return `${theme.label}: ${recommendation}`;
}

function clusterSuggestions(
  suggestions: string[],
): Map<string, string[]> {
  const clusters = new Map<string, string[]>();

  for (const suggestion of suggestions) {
    const normalized = suggestion.trim();
    if (!normalized) {
      continue;
    }

    const theme = classifySuggestion(normalized);
    const clusterId = theme?.id ?? "portfolio";
    const existing = clusters.get(clusterId) ?? [];
    existing.push(normalized);
    clusters.set(clusterId, existing);
  }

  return clusters;
}

export function consolidateImprovementSuggestions(
  report: DeveloperPortfolioReport,
): string[] {
  const rawSuggestions = report.improvementSuggestions.filter(
    (suggestion) => suggestion.trim().length > 0,
  );
  if (rawSuggestions.length === 0) {
    return [];
  }

  const clusters = clusterSuggestions(rawSuggestions);
  const consolidated = IMPROVEMENT_THEMES.flatMap((theme) => {
    const items = clusters.get(theme.id);
    if (!items || items.length === 0) {
      return [];
    }

    const deduped = dedupeWithinCluster(items);
    return [buildConsolidatedSuggestion(theme, deduped, report)];
  }).sort((left, right) => {
    const leftTheme = IMPROVEMENT_THEMES.find((theme) =>
      left.startsWith(`${theme.label}:`),
    );
    const rightTheme = IMPROVEMENT_THEMES.find((theme) =>
      right.startsWith(`${theme.label}:`),
    );
    return (leftTheme?.priority ?? 99) - (rightTheme?.priority ?? 99);
  });

  if (consolidated.length === 0) {
    return dedupeWithinCluster(rawSuggestions).slice(0, MAX_SUGGESTIONS);
  }

  const limited = consolidated.slice(0, MAX_SUGGESTIONS);
  return limited;
}
