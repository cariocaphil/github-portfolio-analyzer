import { truncateResponseBody } from "@/lib/errors/application/diagnostics";

interface GitHubRetryLogEvent {
  event: "github_request_retry";
  path?: string;
  attempt: number;
  httpStatus?: number;
  errorMessage?: string;
  responseBodyPreview?: string;
}

function getGitHubErrorStatus(error: unknown): number | undefined {
  if (error instanceof Error && error.name === "GitHubApiError" && "status" in error) {
    return (error as { status: number }).status;
  }

  return undefined;
}

function getGitHubErrorDetails(
  error: unknown,
): { responseBodyPreview?: string; path?: string } | undefined {
  if (error instanceof Error && "details" in error) {
    return (error as { details?: { responseBodyPreview?: string; path?: string } })
      .details;
  }

  return undefined;
}

export function logGitHubRetryEvent(input: {
  path?: string;
  attempt: number;
  error: unknown;
}): void {
  const details = getGitHubErrorDetails(input.error);
  const payload: GitHubRetryLogEvent = {
    event: "github_request_retry",
    path: input.path ?? details?.path,
    attempt: input.attempt,
    httpStatus: getGitHubErrorStatus(input.error),
    errorMessage: input.error instanceof Error ? input.error.message : undefined,
    responseBodyPreview: details?.responseBodyPreview,
  };

  console.warn(JSON.stringify(payload));
}

export function summarizeGitHubRetryError(error: unknown): string | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const details = getGitHubErrorDetails(error);
  return truncateResponseBody(details?.responseBodyPreview ?? error.message);
}
