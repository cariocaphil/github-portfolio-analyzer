export class ProviderAnalysisError extends Error {
  constructor(
    message: string,
    public readonly providerName?: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ProviderAnalysisError";
  }
}
