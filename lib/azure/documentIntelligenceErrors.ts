export class DocumentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentConfigurationError";
  }
}

export class DocumentAnalysisError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DocumentAnalysisError";
  }
}
