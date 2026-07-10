import {
  BlobConfigurationError,
  BlobUploadError,
} from "@/lib/azure/blobStorageErrors";
import { CvNormalizationError } from "@/lib/azure/cvNormalizerErrors";
import {
  DocumentAnalysisError,
  DocumentAuthenticationError,
  DocumentConfigurationError,
} from "@/lib/azure/documentIntelligenceErrors";
import {
  ApplicationError,
  AzureOpenAIServiceError,
  BlobStorageError,
  ConfigurationError,
  DocumentIntelligenceError,
  GitHubServiceError,
  UnexpectedApplicationError,
  ValidationError,
} from "@/lib/errors/application/types";
import {
  isNetworkError,
  isTransientHttpStatus,
  truncateResponseBody,
} from "@/lib/errors/application/diagnostics";
import { ProviderAnalysisError } from "@/lib/errors/ProviderAnalysisError";
import { ProviderConfigurationError } from "@/lib/errors/ProviderConfigurationError";
import { ProviderExecutionError } from "@/lib/errors/ProviderExecutionError";
import { ProviderUnavailableError } from "@/lib/errors/ProviderUnavailableError";
import { UnsupportedProviderError } from "@/lib/errors/UnsupportedProviderError";
import {
  GitHubApiError,
  GitHubNotFoundError,
  GitHubRateLimitError,
} from "@/lib/github/client";

function mapGitHubError(error: GitHubApiError): GitHubServiceError {
  const transient = isTransientHttpStatus(error.status);

  return new GitHubServiceError({
    userMessage: transient
      ? "GitHub is temporarily unavailable. Please try again in a few moments."
      : "GitHub could not be reached. Please try again.",
    httpStatus: transient ? 503 : 502,
    diagnostics: {
      provider: "github",
      endpoint: error.details?.path,
      httpStatus: error.status,
      responseBodyPreview: error.details?.responseBodyPreview,
      internalMessage: error.message,
    },
    cause: error,
    internalMessage: error.message,
  });
}

function mapAzureProviderError(
  error:
    | ProviderAnalysisError
    | ProviderExecutionError
    | ProviderUnavailableError
    | CvNormalizationError,
): AzureOpenAIServiceError {
  return new AzureOpenAIServiceError({
    userMessage:
      "AI analysis is temporarily unavailable. Please try again in a few moments.",
    httpStatus: 503,
    diagnostics: {
      provider: "azure-openai",
      internalMessage: error.message,
    },
    cause: error,
    internalMessage: error.message,
  });
}

export function normalizeApplicationError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  if (error instanceof GitHubNotFoundError) {
    return new ValidationError({
      userMessage: "We could not find a GitHub user with that username.",
      httpStatus: 404,
      diagnostics: {
        provider: "github",
        endpoint: error.message,
        internalMessage: error.message,
      },
      cause: error,
      internalMessage: error.message,
    });
  }

  if (error instanceof GitHubRateLimitError) {
    return new GitHubServiceError({
      userMessage:
        "GitHub rate limit exceeded. Please try again in a few moments.",
      httpStatus: 429,
      diagnostics: {
        provider: "github",
        httpStatus: error.status,
        internalMessage: error.message,
      },
      cause: error,
      internalMessage: error.message,
    });
  }

  if (error instanceof GitHubApiError) {
    return mapGitHubError(error);
  }

  if (
    error instanceof ProviderConfigurationError ||
    error instanceof UnsupportedProviderError
  ) {
    return new ConfigurationError({
      diagnostics: {
        provider: "portfolio-analysis",
        internalMessage: error.message,
      },
      cause: error,
      internalMessage: error.message,
    });
  }

  if (
    error instanceof ProviderAnalysisError ||
    error instanceof ProviderExecutionError ||
    error instanceof ProviderUnavailableError ||
    error instanceof CvNormalizationError
  ) {
    return mapAzureProviderError(error);
  }

  if (
    error instanceof BlobConfigurationError ||
    error instanceof BlobUploadError
  ) {
    return new BlobStorageError({
      diagnostics: {
        provider: "azure-blob-storage",
        internalMessage: error.message,
      },
      cause: error,
      internalMessage: error.message,
    });
  }

  if (error instanceof DocumentConfigurationError) {
    return new DocumentIntelligenceError({
      diagnostics: {
        provider: "azure-document-intelligence",
        internalMessage: error.message,
      },
      cause: error,
      internalMessage: error.message,
    });
  }

  if (
    error instanceof DocumentAnalysisError ||
    error instanceof DocumentAuthenticationError
  ) {
    return new DocumentIntelligenceError({
      diagnostics: {
        provider: "azure-document-intelligence",
        httpStatus: error.statusCode,
        azureErrorCode:
          error instanceof DocumentAnalysisError ? error.azureErrorCode : undefined,
        correlationId:
          error instanceof DocumentAnalysisError ? error.requestId : undefined,
        internalMessage: error.message,
      },
      cause: error,
      internalMessage: error.message,
    });
  }

  if (isNetworkError(error)) {
    return new GitHubServiceError({
      userMessage:
        "The analysis could not be completed because an external service was temporarily unavailable.",
      httpStatus: 503,
      diagnostics: {
        internalMessage:
          error instanceof Error ? error.message : "Network request failed.",
      },
      cause: error,
      internalMessage: error instanceof Error ? error.message : undefined,
    });
  }

  if (error instanceof Error) {
    if (error.message.includes("GitHub user") && error.message.includes("not found")) {
      return new ValidationError({
        userMessage: "We could not find a GitHub user with that username.",
        httpStatus: 404,
        diagnostics: { internalMessage: error.message },
        cause: error,
        internalMessage: error.message,
      });
    }

    if (error.message.toLowerCase().includes("rate limit")) {
      return new GitHubServiceError({
        userMessage:
          "GitHub rate limit exceeded. Please try again in a few moments.",
        httpStatus: 429,
        diagnostics: { internalMessage: error.message },
        cause: error,
        internalMessage: error.message,
      });
    }

    const githubStatusMatch = error.message.match(/GitHub API error \((\d{3})\)/i);
    if (githubStatusMatch) {
      const status = Number(githubStatusMatch[1]);
      return mapGitHubError(
        new GitHubApiError(error.message, status, {
          path: undefined,
          responseBodyPreview: truncateResponseBody(error.message),
        }),
      );
    }
  }

  return new UnexpectedApplicationError({
    cause: error,
    internalMessage: error instanceof Error ? error.message : String(error),
    diagnostics: {
      internalMessage: error instanceof Error ? error.message : String(error),
    },
  });
}
