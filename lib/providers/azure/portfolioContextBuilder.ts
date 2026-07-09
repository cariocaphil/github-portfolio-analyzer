import type { RepositoryEvidenceProfile } from "@/lib/models/evidence";
import type { UnifiedPortfolioEvidenceModel } from "@/lib/models/portfolio";
import { daysSince } from "@/lib/analysis/utils";

export interface RepositoryContext {
  repository: string;
  markdown: string;
}

function observationText(
  profile: RepositoryEvidenceProfile,
  lensId: string,
): string[] {
  return profile.observations
    .filter((observation) => observation.lensId === lensId)
    .map((observation) => observation.observation);
}

function evidenceFacts(
  profile: RepositoryEvidenceProfile,
  matcher: (path: string, description: string) => boolean,
  limit = 5,
): string[] {
  const facts: string[] = [];
  for (const source of profile.evidenceSources) {
    if (!matcher(source.path.toLowerCase(), source.description.toLowerCase())) {
      continue;
    }
    facts.push(...source.facts.slice(0, 3));
    if (facts.length >= limit) {
      break;
    }
  }
  return facts.slice(0, limit);
}

function readmeExcerpt(profile: RepositoryEvidenceProfile): string {
  const readmeSource = profile.evidenceSources.find((source) =>
    source.path.toLowerCase().includes("readme"),
  );
  if (!readmeSource) {
    return "No README excerpt available.";
  }
  const excerpt = readmeSource.facts.join(" ").trim();
  if (!excerpt) {
    return "README present but no excerpt extracted.";
  }
  return excerpt.slice(0, 500);
}

export function buildRepositoryContext(
  profile: RepositoryEvidenceProfile,
): RepositoryContext {
  const { metadata } = profile;
  const languages = profile.detectedTechnologies
    .filter((tech) => tech.category === "language")
    .map((tech) => tech.name);
  const frameworks = profile.detectedTechnologies
    .filter((tech) => tech.category === "framework")
    .map((tech) => tech.name);
  const tools = profile.detectedTechnologies
    .filter((tech) => tech.category === "tool" || tech.category === "platform")
    .map((tech) => tech.name);

  const purpose =
    observationText(profile, "repository-purpose")[0] ??
    metadata.description ??
    "Purpose not clearly documented.";

  const testing = observationText(profile, "testing-quality");
  const ciCd = observationText(profile, "build-deployment");
  const documentation = observationText(profile, "documentation");
  const structure = observationText(profile, "project-structure");
  const activity = observationText(profile, "activity-evolution");
  const interestingObservations = profile.observations
    .slice(0, 6)
    .map((observation) => `- ${observation.observation}`);

  const markdown = [
    "# Repository",
    "",
    `Name: ${metadata.fullName}`,
    `Purpose: ${purpose}`,
    `Main Technologies: ${[metadata.language, ...languages, ...frameworks].filter(Boolean).join(", ") || "Not detected"}`,
    `Frameworks: ${frameworks.join(", ") || "None detected"}`,
    `Developer Tooling: ${tools.join(", ") || "None detected"}`,
    `Testing Technologies: ${testing.join("; ") || "No visible testing evidence"}`,
    `CI/CD: ${ciCd.join("; ") || "No visible CI/CD evidence"}`,
    `Architecture Patterns: ${structure.join("; ") || "Limited structural evidence"}`,
    `Documentation Quality: ${documentation.join("; ") || "Limited documentation evidence"}`,
    `Repository Size Signals: ${metadata.stars} stars, ${metadata.forks} forks`,
    `Activity: created ${metadata.createdAt}, last push ${metadata.pushedAt} (${daysSince(metadata.pushedAt)} days ago)`,
    `Commit Statistics: not available; using push timestamps only`,
    "",
    "Important README excerpt:",
    readmeExcerpt(profile),
    "",
    "Engineering Evidence:",
    ...evidenceFacts(profile, () => true, 8).map((fact) => `- ${fact}`),
    "",
    "Interesting Observations:",
    ...(interestingObservations.length > 0
      ? interestingObservations
      : ["- No additional observations"]),
    ...(activity.length > 0 ? ["", "Activity & Evolution:", ...activity.map((item) => `- ${item}`)] : []),
  ].join("\n");

  return {
    repository: metadata.fullName,
    markdown,
  };
}

export function buildPortfolioContextCache(
  evidence: UnifiedPortfolioEvidenceModel,
): Map<string, RepositoryContext> {
  const cache = new Map<string, RepositoryContext>();
  for (const profile of evidence.repositoryProfiles) {
    const context = buildRepositoryContext(profile);
    cache.set(context.repository, context);
  }
  return cache;
}

export function buildPortfolioSummaryMarkdown(
  evidence: UnifiedPortfolioEvidenceModel,
): string {
  return [
    "# Portfolio Summary",
    "",
    `Developer: ${evidence.profile.username}`,
    `Repositories analyzed: ${evidence.summary.totalRepositories}`,
    `Primary languages: ${evidence.summary.primaryLanguages.join(", ") || "None"}`,
    `Repositories with README: ${evidence.summary.repositoriesWithReadme}`,
    `Repositories with tests: ${evidence.summary.repositoriesWithTests}`,
    `Repositories with CI: ${evidence.summary.repositoriesWithCi}`,
    `Repositories with Docker: ${evidence.summary.repositoriesWithDocker}`,
    `Topics: ${evidence.summary.topics.join(", ") || "None"}`,
    `Technologies: ${evidence.aggregatedTechnologies.slice(0, 25).join(", ") || "None"}`,
  ].join("\n");
}
