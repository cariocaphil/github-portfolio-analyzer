import { describe, expect, it, vi } from "vitest";
import { isRetryableError, withRetry } from "../retry";

describe("retry", () => {
  it("retries retryable errors with exponential backoff", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValue("ok");

    const result = await withRetry(operation, { maxRetries: 3 });
    expect(result).toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable errors", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("bad request"));

    await expect(withRetry(operation, { maxRetries: 3 })).rejects.toThrow(
      "bad request",
    );
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("identifies retryable status codes", () => {
    expect(isRetryableError({ status: 429 })).toBe(true);
    expect(isRetryableError({ status: 503 })).toBe(true);
    expect(isRetryableError({ status: 400 })).toBe(false);
  });
});
