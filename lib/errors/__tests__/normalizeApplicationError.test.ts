import { describe, expect, it } from "vitest";
import {
  BlobConfigurationError,
  BlobUploadError,
} from "@/lib/azure/blobStorageErrors";
import { DocumentAnalysisError } from "@/lib/azure/documentIntelligenceErrors";
import { ProviderConfigurationError } from "@/lib/errors/ProviderConfigurationError";
import { ProviderExecutionError } from "@/lib/errors/ProviderExecutionError";
import {
  AzureOpenAIServiceError,
  BlobStorageError,
  ConfigurationError,
  DocumentIntelligenceError,
  GitHubServiceError,
  UnexpectedApplicationError,
  ValidationError,
} from "@/lib/errors/application/types";
import { normalizeApplicationError } from "@/lib/errors/normalizeApplicationError";
import { createApiErrorPayload } from "@/lib/errors/apiErrorResponse";
import { GitHubApiError, GitHubNotFoundError } from "@/lib/github/client";

describe("normalizeApplicationError", () => {
  it("maps GitHub HTML 502 responses to a user-friendly GitHubServiceError", () => {
    const error = new GitHubApiError("GitHub API request failed with status 502", 502, {
      path: "/users/test",
      responseBodyPreview: "<!DOCTYPE html><html>GitHub unicorn page",
    });

    const normalized = normalizeApplicationError(error);

    expect(normalized).toBeInstanceOf(GitHubServiceError);
    expect(normalized.userMessage).toBe(
      "GitHub is temporarily unavailable. Please try again in a few moments.",
    );
    expect(normalized.httpStatus).toBe(503);
    expect(normalized.diagnostics.responseBodyPreview).toContain("<!DOCTYPE html>");
    expect(createApiErrorPayload(normalized).error.message).not.toContain("<!DOCTYPE html>");
  });

  it("maps GitHub 504 responses to a transient GitHubServiceError", () => {
    const normalized = normalizeApplicationError(
      new GitHubApiError("GitHub API request failed with status 504", 504),
    );

    expect(normalized).toBeInstanceOf(GitHubServiceError);
    expect(normalized.httpStatus).toBe(503);
  });

  it("maps GitHub not found to ValidationError", () => {
    const normalized = normalizeApplicationError(
      new GitHubNotFoundError("/users/missing"),
    );

    expect(normalized).toBeInstanceOf(ValidationError);
    expect(normalized.userMessage).toContain("could not find a GitHub user");
  });

  it("maps blob storage failures to BlobStorageError", () => {
    const normalized = normalizeApplicationError(
      new BlobConfigurationError("Missing AZURE_STORAGE_CONNECTION_STRING"),
    );

    expect(normalized).toBeInstanceOf(BlobStorageError);
    expect(normalized.userMessage).toContain("File upload is temporarily unavailable");
  });

  it("maps Azure provider failures to AzureOpenAIServiceError", () => {
    const normalized = normalizeApplicationError(
      new ProviderExecutionError("Azure request failed", "AzureOpenAIAnalysisProvider"),
    );

    expect(normalized).toBeInstanceOf(AzureOpenAIServiceError);
    expect(normalized.userMessage).toContain("AI analysis is temporarily unavailable");
  });

  it("maps provider configuration errors to ConfigurationError", () => {
    const normalized = normalizeApplicationError(
      new ProviderConfigurationError("Missing AZURE_OPENAI_ENDPOINT", "Azure"),
    );

    expect(normalized).toBeInstanceOf(ConfigurationError);
    expect(normalized.userMessage).toContain("Service configuration error");
  });

  it("maps document intelligence failures to DocumentIntelligenceError", () => {
    const normalized = normalizeApplicationError(
      new DocumentAnalysisError("Model failed", {
        statusCode: 502,
        azureErrorCode: "ModelNotFound",
      }),
    );

    expect(normalized).toBeInstanceOf(DocumentIntelligenceError);
    expect(normalized.userMessage).toContain("CV extraction is temporarily unavailable");
  });

  it("maps fetch failures to an external service message", () => {
    const fetchError = new TypeError("fetch failed");
    (fetchError as { cause?: { code?: string } }).cause = {
      code: "UND_ERR_CONNECT_TIMEOUT",
    };

    const normalized = normalizeApplicationError(fetchError);

    expect(normalized).toBeInstanceOf(GitHubServiceError);
    expect(normalized.userMessage).toContain("external service was temporarily unavailable");
  });

  it("maps unknown errors to UnexpectedApplicationError", () => {
    const normalized = normalizeApplicationError(new Error("something broke"));

    expect(normalized).toBeInstanceOf(UnexpectedApplicationError);
    expect(normalized.userMessage).not.toContain("something broke");
  });

  it("maps blob upload errors without leaking SDK details", () => {
    const normalized = normalizeApplicationError(
      new BlobUploadError("Azure SDK: RestError: secret details"),
    );

    expect(normalized.userMessage).toBe(
      "File upload is temporarily unavailable. Please try again in a few moments.",
    );
  });
});
