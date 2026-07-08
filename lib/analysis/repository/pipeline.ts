import { getRepositoryLenses } from "@/config/analysisLenses";
import type {
  DetectedTechnology,
  RepositoryEvidenceProfile,
  RepositoryObservation,
} from "@/lib/models/evidence";
import type { EvidenceSource } from "@/lib/models/evidence";
import type { RawRepositoryData } from "@/lib/models/portfolio";
import { repositoryLensAnalyzers } from "./analyzers";

export function analyzeRepository(
  raw: RawRepositoryData,
): RepositoryEvidenceProfile {
  const evidenceSources: EvidenceSource[] = [];
  const observations: RepositoryObservation[] = [];
  const detectedTechnologies: DetectedTechnology[] = [];
  const seenTech = new Set<string>();

  for (const lens of getRepositoryLenses()) {
    const analyzer = repositoryLensAnalyzers[lens.id];
    if (!analyzer) {
      // TODO: Add analyzer when a new repository lens is configured.
      continue;
    }

    const result = analyzer(raw);

    evidenceSources.push(...result.evidenceSources);
    observations.push(
      ...result.observations.map((observation) => ({
        ...observation,
        lensId: lens.id,
        lensTitle: lens.title,
      })),
    );

    for (const tech of result.detectedTechnologies) {
      const key = `${tech.name}:${tech.category}`;
      if (!seenTech.has(key)) {
        seenTech.add(key);
        detectedTechnologies.push(tech);
      }
    }
  }

  return {
    metadata: {
      name: raw.metadata.name,
      fullName: raw.metadata.fullName,
      description: raw.metadata.description,
      url: raw.metadata.url,
      homepage: raw.metadata.homepage,
      topics: raw.metadata.topics,
      stars: raw.metadata.stars,
      forks: raw.metadata.forks,
      isFork: raw.metadata.isFork,
      defaultBranch: raw.metadata.defaultBranch,
      createdAt: raw.metadata.createdAt,
      updatedAt: raw.metadata.updatedAt,
      pushedAt: raw.metadata.pushedAt,
      language: raw.metadata.language,
    },
    detectedTechnologies,
    observations,
    evidenceSources,
  };
}

export function analyzeRepositories(
  repositories: RawRepositoryData[],
): RepositoryEvidenceProfile[] {
  return repositories.map(analyzeRepository);
}
