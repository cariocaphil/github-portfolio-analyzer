import { truncateResponseBody, sanitizeResponseHeaders } from "@/lib/errors/application/diagnostics";
import { logGitHubRetryEvent } from "@/lib/github/githubRetryLogger";
import { withGitHubRetry } from "./retry";

export interface GitHubApiErrorDetails {
  path?: string;
  responseBodyPreview?: string;
  responseHeaders?: Record<string, string>;
}

export class GitHubApiError extends Error {
  readonly details?: GitHubApiErrorDetails;

  constructor(
    message: string,
    public readonly status: number,
    details?: GitHubApiErrorDetails,
  ) {
    super(message);
    this.name = "GitHubApiError";
    this.details = details;
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  readonly retryAfter?: number;

  constructor(retryAfter?: number) {
    super(
      "GitHub API rate limit exceeded.",
      403,
    );
    this.name = "GitHubRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class GitHubNotFoundError extends GitHubApiError {
  constructor(resource: string) {
    super(`GitHub resource not found: ${resource}`, 404, { path: resource });
    this.name = "GitHubNotFoundError";
  }
}

interface GitHubClientOptions {
  token?: string;
}

interface FetchOptions {
  accept?: string;
}

const DEFAULT_ACCEPT = "application/vnd.github+json";
const TOPICS_ACCEPT = "application/vnd.github+json, application/vnd.github.mercy-preview+json";
const USER_AGENT = "github-portfolio-analyzer";

export class GitHubClient {
  private readonly token?: string;
  private readonly baseUrl = "https://api.github.com";

  constructor(options: GitHubClientOptions = {}) {
    this.token = options.token ?? process.env.GITHUB_TOKEN;
  }

  async getUser(username: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/users/${username}`);
  }

  async getUserRepos(username: string): Promise<Record<string, unknown>[]> {
    const repos: Record<string, unknown>[] = [];
    let page = 1;

    while (page <= 3) {
      const batch = await this.request<Record<string, unknown>[]>(
        `/users/${username}/repos?per_page=100&sort=updated&page=${page}`,
        { accept: TOPICS_ACCEPT },
      );

      if (batch.length === 0) {
        break;
      }

      repos.push(...batch);
      if (batch.length < 100) {
        break;
      }
      page += 1;
    }

    return repos;
  }

  async getRepoLanguages(
    owner: string,
    repo: string,
  ): Promise<Record<string, number>> {
    return this.request<Record<string, number>>(
      `/repos/${owner}/${repo}/languages`,
    );
  }

  async getReadme(
    owner: string,
    repo: string,
  ): Promise<{ content: string; htmlUrl: string } | null> {
    try {
      const data = await this.request<{
        content: string;
        html_url: string;
      }>(`/repos/${owner}/${repo}/readme`);
      return {
        content: decodeBase64(data.content),
        htmlUrl: data.html_url,
      };
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
  ): Promise<{ content: string; htmlUrl: string } | null> {
    try {
      const data = await this.request<{
        content: string;
        html_url: string;
        type: string;
      }>(`/repos/${owner}/${repo}/contents/${path}`);

      if (data.type !== "file" || !data.content) {
        return null;
      }

      return {
        content: decodeBase64(data.content),
        htmlUrl: data.html_url,
      };
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getRootContents(
    owner: string,
    repo: string,
  ): Promise<Array<{ name: string; type: string; path: string; html_url: string }>> {
    try {
      const data = await this.request<
        Array<{ name: string; type: string; path: string; html_url: string }>
      >(`/repos/${owner}/${repo}/contents`);
      return data;
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async getWorkflows(
    owner: string,
    repo: string,
  ): Promise<Array<{ id: number; name: string; path: string; html_url: string }>> {
    try {
      const data = await this.request<{
        workflows: Array<{
          id: number;
          name: string;
          path: string;
          html_url: string;
        }>;
      }>(`/repos/${owner}/${repo}/actions/workflows`);
      return data.workflows ?? [];
    } catch (error) {
      if (error instanceof GitHubApiError && error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async getWorkflowFile(
    owner: string,
    repo: string,
    path: string,
  ): Promise<{ content: string; htmlUrl: string } | null> {
    return this.getFileContent(owner, repo, path);
  }

  private async request<T>(
    path: string,
    options: FetchOptions = {},
  ): Promise<T> {
    return withGitHubRetry(
      () => this.executeRequest<T>(path, options),
      {
        onRetry: (attempt, error) => {
          logGitHubRetryEvent({
            path,
            attempt,
            error,
          });
        },
      },
    );
  }

  private async executeRequest<T>(
    path: string,
    options: FetchOptions = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: options.accept ?? DEFAULT_ACCEPT,
      "User-Agent": USER_AGENT,
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, { headers });

    if (response.status === 403) {
      const remaining = response.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        const reset = response.headers.get("x-ratelimit-reset");
        const retryAfter = reset
          ? Math.max(0, Number(reset) * 1000 - Date.now())
          : undefined;
        throw new GitHubRateLimitError(retryAfter);
      }
    }

    if (response.status === 404) {
      throw new GitHubNotFoundError(path);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new GitHubApiError(
        `GitHub API request failed with status ${response.status}`,
        response.status,
        {
          path,
          responseBodyPreview: truncateResponseBody(body),
          responseHeaders: sanitizeResponseHeaders(response.headers),
        },
      );
    }

    return response.json() as Promise<T>;
  }
}

function decodeBase64(content: string): string {
  return Buffer.from(content, "base64").toString("utf-8");
}
