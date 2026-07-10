const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

function isGitHubRateLimitError(
  error: unknown,
): error is Error & { retryAfter?: number } {
  return error instanceof Error && error.name === "GitHubRateLimitError";
}

function getGitHubApiErrorStatus(error: unknown): number | undefined {
  if (error instanceof Error && error.name === "GitHubApiError" && "status" in error) {
    return (error as { status: number }).status;
  }

  return undefined;
}

export function isGitHubRetryableError(error: unknown): boolean {
  if (isGitHubRateLimitError(error)) {
    return true;
  }

  const status = getGitHubApiErrorStatus(error);
  if (status !== undefined && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as { code?: string }).code;
  if (
    code === "ETIMEDOUT" ||
    code === "ECONNABORTED" ||
    code === "ECONNRESET" ||
    code === "UND_ERR_CONNECT_TIMEOUT"
  ) {
    return true;
  }

  const cause = (error as { cause?: { code?: string } }).cause;
  if (
    cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
    cause?.code === "ECONNRESET" ||
    cause?.code === "ETIMEDOUT"
  ) {
    return true;
  }

  const message = (error as { message?: string }).message?.toLowerCase() ?? "";
  return (
    message.includes("fetch failed") ||
    message.includes("timeout") ||
    message.includes("connect timeout")
  );
}

function getGitHubRetryDelayMs(error: unknown, attempt: number): number {
  if (isGitHubRateLimitError(error) && error.retryAfter !== undefined) {
    return Math.min(Math.max(error.retryAfter, 500), 10_000);
  }

  return Math.min(1000 * 2 ** (attempt - 1), 8000);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withGitHubRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (!isGitHubRetryableError(error) || attempt >= maxRetries) {
        throw error;
      }

      attempt += 1;
      options.onRetry?.(attempt, error);
      await sleep(getGitHubRetryDelayMs(error, attempt));
    }
  }
}
