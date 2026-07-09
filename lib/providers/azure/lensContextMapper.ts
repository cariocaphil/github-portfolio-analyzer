import type { AnalysisLens } from "@/lib/models/report";
import type { RepositoryEvidenceProfile } from "@/lib/models/evidence";
import type { UnifiedPortfolioEvidenceModel } from "@/lib/models/portfolio";
import {
  MAX_FACTS_PER_REPO_CONTEXT,
  MAX_OBSERVATIONS_PER_REPO_CONTEXT,
  MAX_REPOS_PER_LENS_CONTEXT,
  MAX_TECHNOLOGIES_PER_REPO_CONTEXT,
} from "./azureContextLimits";

const LENS_REPOSITORY_OBSERVATION_IDS: Record<string, string[]> = {
  "technical-breadth": ["technical-stack", "repository-purpose"],
  "project-complexity": [
    "technical-stack",
    "build-deployment",
    "project-structure",
    "testing-quality",
  ],
  "engineering-practices": [
    "testing-quality",
    "build-deployment",
    "documentation",
    "project-structure",
  ],
  "portfolio-documentation": ["documentation", "repository-purpose"],
  "portfolio-testing-quality": ["testing-quality", "build-deployment"],
  "deployment-delivery": ["build-deployment", "technical-stack"],
  "project-evolution": ["activity-evolution"],
};

const LENS_EVIDENCE_MATCHERS: Record<
  string,
  (path: string, description: string) => boolean
> = {
  "technical-breadth": (path, description) =>
    path === "languages" ||
    path === "package.json" ||
    path === "requirements.txt" ||
    description.includes("language"),
  "project-complexity": (path, description) =>
    path.toLowerCase() === "dockerfile" ||
    description.includes("workflow") ||
    description.includes("structure"),
  "engineering-practices": (path, description) =>
    description.includes("test") ||
    description.includes("workflow") ||
    description.includes("readme") ||
    path === "/",
  "portfolio-documentation": (path, description) =>
    path.toLowerCase().includes("readme") || description.includes("readme"),
  "portfolio-testing-quality": (path, description) =>
    description.includes("test") || description.includes("workflow"),
  "deployment-delivery": (path, description) =>
    path.toLowerCase() === "dockerfile" ||
    description.includes("deploy") ||
    description.includes("homepage") ||
    description.includes("script"),
  "project-evolution": (_path, description) =>
    description.includes("timestamp") || description.includes("activity"),
};

function profileMatchesLens(
  profile: RepositoryEvidenceProfile,
  lensId: string,
): boolean {
  const observationLensIds = LENS_REPOSITORY_OBSERVATION_IDS[lensId] ?? [];
  if (
    profile.observations.some((observation) =>
      observationLensIds.includes(observation.lensId),
    )
  ) {
    return true;
  }

  const matcher = LENS_EVIDENCE_MATCHERS[lensId];
  if (!matcher) {
    return true;
  }

  return profile.evidenceSources.some((source) =>
    matcher(source.path.toLowerCase(), source.description.toLowerCase()),
  );
}

function isNoiseFact(fact: string): boolean {
  const lower = fact.toLowerCase();
  return (
    lower.startsWith("word count:") ||
    lower.startsWith("section headings") ||
    lower.startsWith("scripts:") ||
    lower.startsWith("package name:") ||
    lower.startsWith("total dependencies") ||
    lower.includes("http://") ||
    lower.includes("https://")
  );
}

function compactFact(fact: string): string {
  if (fact.toLowerCase().startsWith("dependency:")) {
    return fact.replace(/^dependency:\s*/i, "").trim();
  }
  return fact.trim();
}

function relevantTechnologies(
  profile: RepositoryEvidenceProfile,
  lensId: string,
): string[] {
  const names = new Set<string>();
  if (profile.metadata.language) {
    names.add(profile.metadata.language);
  }

  const matcher = LENS_EVIDENCE_MATCHERS[lensId];
  for (const tech of profile.detectedTechnologies) {
    if (matcher && lensId !== "technical-breadth") {
      const hasMatchingSource = profile.evidenceSources.some((source) =>
        matcher(source.path.toLowerCase(), source.description.toLowerCase()),
      );
      if (!hasMatchingSource && tech.category === "tool") {
        continue;
      }
    }
    names.add(tech.name);
    if (names.size >= MAX_TECHNOLOGIES_PER_REPO_CONTEXT) {
      break;
    }
  }

  return [...names].slice(0, MAX_TECHNOLOGIES_PER_REPO_CONTEXT);
}

function lensObservations(
  profile: RepositoryEvidenceProfile,
  lensId: string,
): string[] {
  const observationLensIds = LENS_REPOSITORY_OBSERVATION_IDS[lensId] ?? [];
  return profile.observations
    .filter((observation) => observationLensIds.includes(observation.lensId))
    .map((observation) => observation.observation)
    .slice(0, MAX_OBSERVATIONS_PER_REPO_CONTEXT);
}

function lensEvidenceDetails(
  profile: RepositoryEvidenceProfile,
  lensId: string,
): { facts: string[]; sources: string[] } {
  const matcher = LENS_EVIDENCE_MATCHERS[lensId];
  const facts: string[] = [];
  const sources: string[] = [];

  if (!matcher) {
    return { facts, sources };
  }

  for (const source of profile.evidenceSources) {
    if (!matcher(source.path.toLowerCase(), source.description.toLowerCase())) {
      continue;
    }

    if (source.path && !sources.includes(source.path)) {
      sources.push(source.path);
    }

    for (const fact of source.facts) {
      if (isNoiseFact(fact)) {
        continue;
      }
      const normalized = compactFact(fact);
      if (!normalized || facts.includes(normalized)) {
        continue;
      }
      facts.push(normalized);
      if (facts.length >= MAX_FACTS_PER_REPO_CONTEXT) {
        break;
      }
    }

    if (facts.length >= MAX_FACTS_PER_REPO_CONTEXT) {
      break;
    }
  }

  return {
    facts,
    sources: sources.slice(0, MAX_FACTS_PER_REPO_CONTEXT),
  };
}

function profileRelevanceScore(
  profile: RepositoryEvidenceProfile,
  lensId: string,
): number {
  const observations = lensObservations(profile, lensId).length;
  const { facts } = lensEvidenceDetails(profile, lensId);
  return profile.metadata.stars * 10 + observations * 5 + facts.length * 3;
}

function buildCompactRepositoryBlock(
  profile: RepositoryEvidenceProfile,
  lensId: string,
): string {
  const observations = lensObservations(profile, lensId);
  const technologies = relevantTechnologies(profile, lensId);
  const { facts, sources } = lensEvidenceDetails(profile, lensId);

  return [
    `## ${profile.metadata.fullName}`,
    `Primary language: ${profile.metadata.language ?? "Unknown"}`,
    `Technologies: ${technologies.join(", ") || "None detected"}`,
    ...(observations.length > 0
      ? ["Observations:", ...observations.map((item) => `- ${item}`)]
      : []),
    ...(facts.length > 0 ? ["Evidence facts:", ...facts.map((item) => `- ${item}`)] : []),
    ...(sources.length > 0
      ? [`Sources: ${sources.join(", ")}`]
      : []),
  ].join("\n");
}

export function buildLensContextMarkdown(params: {
  lens: AnalysisLens;
  evidence: UnifiedPortfolioEvidenceModel;
}): string {
  const relevantProfiles = params.evidence.repositoryProfiles
    .filter((profile) => profileMatchesLens(profile, params.lens.id))
    .sort(
      (left, right) =>
        profileRelevanceScore(right, params.lens.id) -
        profileRelevanceScore(left, params.lens.id),
    )
    .slice(0, MAX_REPOS_PER_LENS_CONTEXT);

  const sections = relevantProfiles.map((profile) =>
    buildCompactRepositoryBlock(profile, params.lens.id),
  );

  if (sections.length === 0) {
    return "No repository evidence matched this lens.";
  }

  return sections.join("\n\n");
}
