const RETRYABLE_STATUS_CODES = new Set([429, 503]);

export function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const status = (error as { status?: number }).status;
  if (status && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  const code = (error as { code?: string }).code;
  if (code === "ETIMEDOUT" || code === "ECONNABORTED" || code === "ECONNRESET") {
    return true;
  }

  const message = (error as { message?: string }).message?.toLowerCase() ?? "";
  return message.includes("timeout") || message.includes("rate limit");
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
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
      if (!isRetryableError(error) || attempt >= maxRetries) {
        throw error;
      }

      attempt += 1;
      options.onRetry?.(attempt, error);
      const delayMs = Math.min(1000 * 2 ** (attempt - 1), 8000);
      await sleep(delayMs);
    }
  }
}
