import type { UnifiedPortfolioEvidenceModel } from "@/lib/models/portfolio";

export function createSampleEvidence(): UnifiedPortfolioEvidenceModel {
  return {
    profile: {
      username: "dev-user",
      name: "Dev User",
      bio: "Software engineer",
      avatarUrl: null,
      publicRepos: 2,
      followers: 10,
      following: 5,
      createdAt: "2020-01-01T00:00:00Z",
      url: "https://github.com/dev-user",
    },
    repositoryProfiles: [
      {
        metadata: {
          name: "app",
          fullName: "dev-user/app",
          description: "React application",
          url: "https://github.com/dev-user/app",
          homepage: null,
          topics: ["react"],
          stars: 12,
          forks: 2,
          isFork: false,
          defaultBranch: "main",
          createdAt: "2021-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          pushedAt: "2024-06-01T00:00:00Z",
          language: "TypeScript",
        },
        detectedTechnologies: [
          { name: "TypeScript", category: "language", source: "GitHub" },
          { name: "React", category: "framework", source: "package.json" },
        ],
        observations: [
          {
            lensId: "technical-stack",
            lensTitle: "Technical Stack",
            observation: "Uses React and TypeScript.",
            rationale: "From package manifest.",
            confidence: "high",
            evidenceSourceIds: ["ev-1"],
          },
          {
            lensId: "testing-quality",
            lensTitle: "Testing & Quality",
            observation: "Includes test directory.",
            rationale: "Visible tests folder.",
            confidence: "medium",
            evidenceSourceIds: ["ev-2"],
          },
          {
            lensId: "activity-evolution",
            lensTitle: "Activity & Evolution",
            observation: "Recently updated.",
            rationale: "Recent push timestamp.",
            confidence: "high",
            evidenceSourceIds: ["ev-3"],
          },
        ],
        evidenceSources: [
          {
            id: "ev-1",
            repository: "dev-user/app",
            path: "package.json",
            description: "Node.js package manifest",
            facts: ["dependency: react", "dependency: typescript"],
            githubUrl: "https://github.com/dev-user/app/blob/main/package.json",
          },
          {
            id: "ev-2",
            repository: "dev-user/app",
            path: "tests",
            description: "Visible test files or directories",
            facts: ["tests"],
            githubUrl: "https://github.com/dev-user/app/tree/main/tests",
          },
          {
            id: "ev-3",
            repository: "dev-user/app",
            path: "repository metadata",
            description: "Repository activity timestamps",
            facts: ["Days since last push: 10"],
            githubUrl: "https://github.com/dev-user/app",
          },
        ],
      },
    ],
    aggregatedTechnologies: ["TypeScript", "React"],
    evidenceSources: [
      {
        id: "ev-1",
        repository: "dev-user/app",
        path: "package.json",
        description: "Node.js package manifest",
        facts: ["dependency: react", "dependency: typescript"],
        githubUrl: "https://github.com/dev-user/app/blob/main/package.json",
      },
    ],
    summary: {
      totalRepositories: 1,
      repositoriesWithReadme: 1,
      repositoriesWithTests: 1,
      repositoriesWithCi: 0,
      repositoriesWithDocker: 0,
      repositoriesWithDeploymentConfig: 0,
      primaryLanguages: ["TypeScript"],
      topics: ["react"],
    },
  };
}
