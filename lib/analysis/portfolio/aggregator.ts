import type { RepositoryEvidenceProfile } from "@/lib/models/evidence";
import type {
  GitHubPortfolio,
  ProfileMetadata,
  UnifiedPortfolioEvidenceModel,
} from "@/lib/models/portfolio";
import { normalizeTechnologyName } from "@/lib/technology/normalization";

function hasObservationMatching(
  profile: RepositoryEvidenceProfile,
  lensId: string,
  pattern: RegExp,
): boolean {
  return profile.observations.some(
    (obs) => obs.lensId === lensId && pattern.test(obs.observation),
  );
}

function hasReadme(profile: RepositoryEvidenceProfile): boolean {
  return profile.evidenceSources.some(
    (source) =>
      source.path.toLowerCase().includes("readme") &&
      !source.description.toLowerCase().includes("absence"),
  );
}

function hasTests(profile: RepositoryEvidenceProfile): boolean {
  return hasObservationMatching(
    profile,
    "testing-quality",
    /test-related paths|workflows reference testing/i,
  );
}

function hasCi(profile: RepositoryEvidenceProfile): boolean {
  return profile.evidenceSources.some(
    (source) =>
      source.path.includes(".github/workflows") ||
      source.description.toLowerCase().includes("workflow"),
  );
}

function hasDocker(profile: RepositoryEvidenceProfile): boolean {
  return profile.evidenceSources.some(
    (source) => source.path.toLowerCase() === "dockerfile",
  );
}

function hasDeployment(profile: RepositoryEvidenceProfile): boolean {
  return (
    hasDocker(profile) ||
    profile.metadata.homepage !== null ||
    hasObservationMatching(
      profile,
      "build-deployment",
      /deployment|homepage|dockerfile/i,
    )
  );
}

export function aggregatePortfolioEvidence(
  portfolio: GitHubPortfolio,
  repositoryProfiles: RepositoryEvidenceProfile[],
): UnifiedPortfolioEvidenceModel {
  const profile: ProfileMetadata = {
    username: portfolio.profile.username,
    name: portfolio.profile.name,
    bio: portfolio.profile.bio,
    avatarUrl: portfolio.profile.avatarUrl,
    publicRepos: portfolio.profile.publicRepos,
    followers: portfolio.profile.followers,
    following: portfolio.profile.following,
    createdAt: portfolio.profile.createdAt,
    url: portfolio.profile.url,
  };

  const techSet = new Set<string>();
  for (const repoProfile of repositoryProfiles) {
    for (const tech of repoProfile.detectedTechnologies) {
      const normalized = normalizeTechnologyName(tech.name);
      if (normalized) {
        techSet.add(normalized);
      }
    }
  }

  const topicSet = new Set<string>();
  for (const repoProfile of repositoryProfiles) {
    for (const topic of repoProfile.metadata.topics) {
      topicSet.add(topic);
    }
  }

  const languageCounts = new Map<string, number>();
  for (const repoProfile of repositoryProfiles) {
    if (repoProfile.metadata.language) {
      const lang = repoProfile.metadata.language;
      languageCounts.set(lang, (languageCounts.get(lang) ?? 0) + 1);
    }
  }

  const primaryLanguages = [...languageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  const evidenceSources = repositoryProfiles.flatMap((p) => p.evidenceSources);

  const repositoriesWithReadme = repositoryProfiles.filter(hasReadme).length;
  const repositoriesWithTests = repositoryProfiles.filter(hasTests).length;
  const repositoriesWithCi = repositoryProfiles.filter(hasCi).length;
  const repositoriesWithDocker = repositoryProfiles.filter(hasDocker).length;
  const repositoriesWithDeploymentConfig =
    repositoryProfiles.filter(hasDeployment).length;

  return {
    profile,
    repositoryProfiles,
    aggregatedTechnologies: [...techSet].sort(),
    evidenceSources,
    summary: {
      totalRepositories: repositoryProfiles.length,
      repositoriesWithReadme,
      repositoriesWithTests,
      repositoriesWithCi,
      repositoriesWithDocker,
      repositoriesWithDeploymentConfig,
      primaryLanguages,
      topics: [...topicSet].sort(),
    },
  };
}
