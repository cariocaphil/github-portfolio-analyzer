import { GitHubClient, GitHubNotFoundError } from "./client";
import { mapWithConcurrency } from "./concurrency";
import type {
  GitHubPortfolio,
  RawRepositoryArtifact,
  RawRepositoryData,
  RawTestIndicator,
  RawWorkflowFile,
} from "@/lib/models/portfolio";

const TEST_DIRECTORY_NAMES = new Set([
  "test",
  "tests",
  "__tests__",
  "spec",
  "specs",
]);

const TEST_FILE_PATTERN =
  /\.(test|spec)\.(ts|tsx|js|jsx|py|go|rs|java|rb|php)$/i;

const ARTIFACT_PATHS = {
  packageJson: "package.json",
  requirementsTxt: "requirements.txt",
  pyprojectToml: "pyproject.toml",
  dockerfile: "Dockerfile",
} as const;

const MAX_REPOSITORIES = 30;
/** Max repositories fetched in parallel to avoid GitHub API overload. */
const REPOSITORY_FETCH_CONCURRENCY = 4;

export async function fetchGitHubPortfolio(
  username: string,
): Promise<GitHubPortfolio> {
  const client = new GitHubClient();

  let user: Record<string, unknown>;
  try {
    user = await client.getUser(username);
  } catch (error) {
    if (error instanceof GitHubNotFoundError) {
      throw new Error(`GitHub user "${username}" was not found.`);
    }
    throw error;
  }

  const repos = await client.getUserRepos(username);
  const selectedRepos = repos
    .filter((repo) => !repo.archived)
    .slice(0, MAX_REPOSITORIES);

  const repositories = await mapWithConcurrency(
    selectedRepos,
    REPOSITORY_FETCH_CONCURRENCY,
    (repo) => fetchRepositoryEvidence(client, repo, username),
  );

  return {
    profile: {
      username: String(user.login),
      name: (user.name as string | null) ?? null,
      bio: (user.bio as string | null) ?? null,
      avatarUrl: (user.avatar_url as string | null) ?? null,
      publicRepos: Number(user.public_repos ?? 0),
      followers: Number(user.followers ?? 0),
      following: Number(user.following ?? 0),
      createdAt: String(user.created_at),
      url: String(user.html_url),
    },
    repositories,
  };
}

async function fetchRepositoryEvidence(
  client: GitHubClient,
  repo: Record<string, unknown>,
  username: string,
): Promise<RawRepositoryData> {
  const fullName = String(repo.full_name);
  const [owner, name] = fullName.split("/");

  const [languages, readme, rootContents, workflows] = await Promise.all([
    client.getRepoLanguages(owner, name),
    client.getReadme(owner, name),
    client.getRootContents(owner, name),
    client.getWorkflows(owner, name),
  ]);

  const [packageJson, requirementsTxt, pyprojectToml, dockerfile] =
    await Promise.all([
      fetchArtifact(client, owner, name, ARTIFACT_PATHS.packageJson),
      fetchArtifact(client, owner, name, ARTIFACT_PATHS.requirementsTxt),
      fetchArtifact(client, owner, name, ARTIFACT_PATHS.pyprojectToml),
      fetchArtifact(client, owner, name, ARTIFACT_PATHS.dockerfile),
    ]);

  const workflowFiles = await Promise.all(
    workflows.map(async (workflow) => {
      const file = await client.getWorkflowFile(owner, name, workflow.path);
      return {
        path: workflow.path,
        name: workflow.name,
        content: file?.content ?? null,
        githubUrl: workflow.html_url,
      } satisfies RawWorkflowFile;
    }),
  );

  const testIndicators = detectTestIndicators(rootContents);

  return {
    metadata: {
      name,
      fullName,
      description: (repo.description as string | null) ?? null,
      url: String(repo.html_url),
      homepage: (repo.homepage as string | null) ?? null,
      topics: Array.isArray(repo.topics) ? (repo.topics as string[]) : [],
      stars: Number(repo.stargazers_count ?? 0),
      forks: Number(repo.forks_count ?? 0),
      isFork: Boolean(repo.fork),
      defaultBranch: String(repo.default_branch ?? "main"),
      createdAt: String(repo.created_at),
      updatedAt: String(repo.updated_at),
      pushedAt: String(repo.pushed_at),
      language: (repo.language as string | null) ?? null,
    },
    languages,
    readme: toArtifact(readme, fullName, "README.md"),
    packageJson: toArtifactFromPath(packageJson, fullName, ARTIFACT_PATHS.packageJson),
    requirementsTxt: toArtifactFromPath(
      requirementsTxt,
      fullName,
      ARTIFACT_PATHS.requirementsTxt,
    ),
    pyprojectToml: toArtifactFromPath(
      pyprojectToml,
      fullName,
      ARTIFACT_PATHS.pyprojectToml,
    ),
    dockerfile: toArtifactFromPath(dockerfile, fullName, ARTIFACT_PATHS.dockerfile),
    workflows: workflowFiles,
    testIndicators,
    rootEntries: rootContents.map((entry) => entry.name),
  };
}

async function fetchArtifact(
  client: GitHubClient,
  owner: string,
  repo: string,
  path: string,
): Promise<{ content: string; htmlUrl: string } | null> {
  return client.getFileContent(owner, repo, path);
}

function toArtifact(
  file: { content: string; htmlUrl: string } | null,
  repository: string,
  path: string,
): RawRepositoryArtifact {
  return {
    path,
    content: file?.content ?? null,
    exists: Boolean(file?.content),
    githubUrl: file?.htmlUrl ?? buildBlobUrl(repository, path),
  };
}

function toArtifactFromPath(
  file: { content: string; htmlUrl: string } | null,
  repository: string,
  path: string,
): RawRepositoryArtifact {
  return toArtifact(file, repository, path);
}

function detectTestIndicators(
  rootContents: Array<{ name: string; type: string; path: string; html_url: string }>,
): RawTestIndicator[] {
  const indicators: RawTestIndicator[] = [];

  for (const entry of rootContents) {
    const lowerName = entry.name.toLowerCase();

    if (entry.type === "dir" && TEST_DIRECTORY_NAMES.has(lowerName)) {
      indicators.push({
        path: entry.path,
        type: "directory",
        githubUrl: entry.html_url,
      });
    }

    if (entry.type === "file" && TEST_FILE_PATTERN.test(entry.name)) {
      indicators.push({
        path: entry.path,
        type: "file",
        githubUrl: entry.html_url,
      });
    }
  }

  return indicators;
}

function buildBlobUrl(repository: string, path: string): string {
  return `https://github.com/${repository}/blob/HEAD/${path}`;
}
