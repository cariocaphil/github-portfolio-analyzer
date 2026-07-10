const BODY_PREVIEW_LIMIT = 500;

export function truncateResponseBody(body: string | undefined): string | undefined {
  if (!body) {
    return undefined;
  }

  const normalized = body.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.length <= BODY_PREVIEW_LIMIT) {
    return normalized;
  }

  return `${normalized.slice(0, BODY_PREVIEW_LIMIT)}…`;
}

export function sanitizeResponseHeaders(
  headers: Headers | undefined,
): Record<string, string> | undefined {
  if (!headers) {
    return undefined;
  }

  const allowed = [
    "retry-after",
    "x-ratelimit-remaining",
    "x-ratelimit-reset",
    "x-github-request-id",
    "x-ms-request-id",
    "content-type",
  ];

  const sanitized: Record<string, string> = {};
  for (const key of allowed) {
    const value = headers.get(key);
    if (value) {
      sanitized[key] = value;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function isTransientHttpStatus(status: number | undefined): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

export function isNetworkError(error: unknown): boolean {
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
