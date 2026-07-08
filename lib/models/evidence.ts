export type ConfidenceLevel = "high" | "medium" | "low";

export interface EvidenceSource {
  id: string;
  repository: string;
  path: string;
  description: string;
  facts: string[];
  githubUrl?: string;
}

export interface RepositoryMetadata {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  topics: string[];
  stars: number;
  forks: number;
  isFork: boolean;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  language: string | null;
}

export interface DetectedTechnology {
  name: string;
  category: "language" | "framework" | "tool" | "platform" | "runtime";
  source: string;
}

export interface RepositoryObservation {
  lensId: string;
  lensTitle: string;
  observation: string;
  rationale: string;
  confidence: ConfidenceLevel;
  evidenceSourceIds: string[];
}

export interface RepositoryEvidenceProfile {
  metadata: RepositoryMetadata;
  detectedTechnologies: DetectedTechnology[];
  observations: RepositoryObservation[];
  evidenceSources: EvidenceSource[];
}
