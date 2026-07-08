export class ProviderUnavailableError extends Error {
  constructor(
    message: string,
    public readonly providerName?: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}
