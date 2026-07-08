import type { EvidenceSource, RepositoryEvidenceProfile } from "./evidence";

export interface GitHubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  url: string;
}

export interface RawRepositoryArtifact {
  path: string;
  content: string | null;
  exists: boolean;
  githubUrl: string;
}

export interface RawWorkflowFile {
  path: string;
  name: string;
  content: string | null;
  githubUrl: string;
}

export interface RawTestIndicator {
  path: string;
  type: "directory" | "file";
  githubUrl: string;
}

export interface RawRepositoryData {
  metadata: {
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
  };
  languages: Record<string, number>;
  readme: RawRepositoryArtifact;
  packageJson: RawRepositoryArtifact;
  requirementsTxt: RawRepositoryArtifact;
  pyprojectToml: RawRepositoryArtifact;
  dockerfile: RawRepositoryArtifact;
  workflows: RawWorkflowFile[];
  testIndicators: RawTestIndicator[];
  rootEntries: string[];
}

export interface GitHubPortfolio {
  profile: GitHubProfile;
  repositories: RawRepositoryData[];
}

export interface ProfileMetadata {
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
  url: string;
}

export interface UnifiedPortfolioEvidenceModel {
  profile: ProfileMetadata;
  repositoryProfiles: RepositoryEvidenceProfile[];
  aggregatedTechnologies: string[];
  evidenceSources: EvidenceSource[];
  summary: {
    totalRepositories: number;
    repositoriesWithReadme: number;
    repositoriesWithTests: number;
    repositoriesWithCi: number;
    repositoriesWithDocker: number;
    repositoriesWithDeploymentConfig: number;
    primaryLanguages: string[];
    topics: string[];
  };
}
