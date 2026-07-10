import { describe, expect, it, vi } from "vitest";
import { GitHubApiError, GitHubRateLimitError } from "@/lib/github/client";
import { isGitHubRetryableError, withGitHubRetry } from "@/lib/github/retry";

describe("github retry", () => {
  it("retries GitHub 502 errors with exponential backoff", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new GitHubApiError("upstream", 502))
      .mockResolvedValue("ok");

    const result = await withGitHubRetry(operation, { maxRetries: 3 });
    expect(result).toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("retries GitHub 503 errors", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new GitHubApiError("unavailable", 503))
      .mockResolvedValue("ok");

    await expect(withGitHubRetry(operation, { maxRetries: 3 })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("retries rate limit errors", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new GitHubRateLimitError(500))
      .mockResolvedValue("ok");

    await expect(withGitHubRetry(operation, { maxRetries: 3 })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("retries connect timeout fetch failures", async () => {
    const timeoutError = new TypeError("fetch failed");
    (timeoutError as { cause?: { code?: string } }).cause = {
      code: "UND_ERR_CONNECT_TIMEOUT",
    };

    const operation = vi
      .fn()
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValue("ok");

    await expect(withGitHubRetry(operation, { maxRetries: 3 })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable GitHub errors", async () => {
    const operation = vi
      .fn()
      .mockRejectedValue(new GitHubApiError("bad request", 400));

    await expect(withGitHubRetry(operation, { maxRetries: 3 })).rejects.toMatchObject({
      status: 400,
    });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("identifies retryable status codes", () => {
    expect(isGitHubRetryableError(new GitHubApiError("x", 502))).toBe(true);
    expect(isGitHubRetryableError(new GitHubApiError("x", 503))).toBe(true);
    expect(isGitHubRetryableError(new GitHubApiError("x", 429))).toBe(true);
    expect(isGitHubRetryableError(new GitHubApiError("x", 404))).toBe(false);
  });
});
