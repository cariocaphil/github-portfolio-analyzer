export class DocumentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentConfigurationError";
  }
}

export class DocumentAuthenticationError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DocumentAuthenticationError";
    this.statusCode = statusCode;
  }
}

export class DocumentAnalysisError extends Error {
  readonly statusCode?: number;
  readonly azureErrorCode?: string;
  readonly requestId?: string;

  constructor(
    message: string,
    options?: {
      cause?: unknown;
      statusCode?: number;
      azureErrorCode?: string;
      requestId?: string;
    },
  ) {
    super(message, options);
    this.name = "DocumentAnalysisError";
    this.statusCode = options?.statusCode;
    this.azureErrorCode = options?.azureErrorCode;
    this.requestId = options?.requestId;
  }
}
