import type { AnalysisLens } from "@/lib/models/report";
import type { RepositoryEvidenceProfile } from "@/lib/models/evidence";
import type { UnifiedPortfolioEvidenceModel } from "@/lib/models/portfolio";
import type { RepositoryContext } from "./portfolioContextBuilder";

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

function summarizeProfileForLens(
  profile: RepositoryEvidenceProfile,
  lensId: string,
): string[] {
  const observationLensIds = LENS_REPOSITORY_OBSERVATION_IDS[lensId] ?? [];
  const observations = profile.observations
    .filter((observation) => observationLensIds.includes(observation.lensId))
    .map((observation) => observation.observation);

  const matcher = LENS_EVIDENCE_MATCHERS[lensId];
  const evidenceFacts = matcher
    ? profile.evidenceSources
        .filter((source) =>
          matcher(source.path.toLowerCase(), source.description.toLowerCase()),
        )
        .flatMap((source) => source.facts.slice(0, 2))
        .slice(0, 6)
    : [];

  return [...observations, ...evidenceFacts];
}

export function buildLensContextMarkdown(params: {
  lens: AnalysisLens;
  evidence: UnifiedPortfolioEvidenceModel;
  repositoryContexts: Map<string, RepositoryContext>;
}): string {
  const relevantProfiles = params.evidence.repositoryProfiles.filter((profile) =>
    profileMatchesLens(profile, params.lens.id),
  );

  const sections = relevantProfiles.map((profile) => {
    const cached = params.repositoryContexts.get(profile.metadata.fullName);
    const highlights = summarizeProfileForLens(profile, params.lens.id);
    return [
      `## ${profile.metadata.fullName}`,
      ...(cached ? [cached.markdown.split("Important README excerpt:")[0]?.trim() ?? ""] : []),
      "",
      "Lens-relevant highlights:",
      ...(highlights.length > 0
        ? highlights.map((item) => `- ${item}`)
        : ["- Limited lens-specific evidence"]),
    ].join("\n");
  });

  if (sections.length === 0) {
    return "No repository evidence matched this lens.";
  }

  return sections.join("\n\n");
}
