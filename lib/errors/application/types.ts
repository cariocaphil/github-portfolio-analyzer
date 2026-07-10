export interface ErrorDiagnostics {
  provider?: string;
  endpoint?: string;
  httpStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBodyPreview?: string;
  requestDurationMs?: number;
  retryAttempts?: number;
  correlationId?: string;
  stage?: string;
  azureErrorCode?: string;
  internalMessage?: string;
}

export interface ApplicationErrorOptions {
  title?: string;
  userMessage: string;
  httpStatus: number;
  diagnostics?: ErrorDiagnostics;
  cause?: unknown;
  internalMessage?: string;
}

export type PartialApplicationErrorOptions = Partial<ApplicationErrorOptions> & {
  cause?: unknown;
};

export class ApplicationError extends Error {
  readonly title: string;
  readonly userMessage: string;
  readonly httpStatus: number;
  readonly diagnostics: ErrorDiagnostics;

  constructor(options: ApplicationErrorOptions) {
    super(options.internalMessage ?? options.userMessage, { cause: options.cause });
    this.name = "ApplicationError";
    this.title = options.title ?? "Request could not be completed";
    this.userMessage = options.userMessage;
    this.httpStatus = options.httpStatus;
    this.diagnostics = options.diagnostics ?? {};
  }
}

export class ExternalServiceError extends ApplicationError {
  readonly serviceProvider: string;

  constructor(
    serviceProvider: string,
    options: ApplicationErrorOptions,
  ) {
    super({
      ...options,
      diagnostics: {
        provider: serviceProvider,
        ...options.diagnostics,
      },
    });
    this.name = "ExternalServiceError";
    this.serviceProvider = serviceProvider;
  }
}

export class GitHubServiceError extends ExternalServiceError {
  constructor(options: PartialApplicationErrorOptions = {}) {
    super("github", {
      ...options,
      title: options.title ?? "Analysis could not be completed",
      userMessage:
        options.userMessage ??
        "GitHub is temporarily unavailable. Please try again in a few moments.",
      httpStatus: options.httpStatus ?? 503,
    });
    this.name = "GitHubServiceError";
  }
}

export class AzureOpenAIServiceError extends ExternalServiceError {
  constructor(options: PartialApplicationErrorOptions = {}) {
    super("azure-openai", {
      ...options,
      title: options.title ?? "Analysis could not be completed",
      userMessage:
        options.userMessage ??
        "AI analysis is temporarily unavailable. Please try again in a few moments.",
      httpStatus: options.httpStatus ?? 503,
    });
    this.name = "AzureOpenAIServiceError";
  }
}

export class BlobStorageError extends ExternalServiceError {
  constructor(options: PartialApplicationErrorOptions = {}) {
    super("azure-blob-storage", {
      ...options,
      title: options.title ?? "File upload could not be completed",
      userMessage:
        options.userMessage ??
        "File upload is temporarily unavailable. Please try again in a few moments.",
      httpStatus: options.httpStatus ?? 503,
    });
    this.name = "BlobStorageError";
  }
}

export class DocumentIntelligenceError extends ExternalServiceError {
  constructor(options: PartialApplicationErrorOptions = {}) {
    super("azure-document-intelligence", {
      ...options,
      title: options.title ?? "CV extraction could not be completed",
      userMessage:
        options.userMessage ??
        "CV extraction is temporarily unavailable. Please try again in a few moments.",
      httpStatus: options.httpStatus ?? 503,
    });
    this.name = "DocumentIntelligenceError";
  }
}

export class ValidationError extends ApplicationError {
  constructor(options: PartialApplicationErrorOptions & Pick<ApplicationErrorOptions, "userMessage">) {
    super({
      ...options,
      title: options.title ?? "Invalid request",
      httpStatus: options.httpStatus ?? 400,
    });
    this.name = "ValidationError";
  }
}

export class ConfigurationError extends ApplicationError {
  constructor(options: PartialApplicationErrorOptions = {}) {
    super({
      ...options,
      title: options.title ?? "Service unavailable",
      userMessage:
        options.userMessage ?? "Service configuration error. Please contact support.",
      httpStatus: options.httpStatus ?? 500,
    });
    this.name = "ConfigurationError";
  }
}

export class UnexpectedApplicationError extends ApplicationError {
  constructor(options: PartialApplicationErrorOptions = {}) {
    super({
      ...options,
      title: options.title ?? "Something went wrong",
      userMessage:
        options.userMessage ??
        "An unexpected error occurred. Please try again in a few moments.",
      httpStatus: options.httpStatus ?? 500,
    });
    this.name = "UnexpectedApplicationError";
  }
}
