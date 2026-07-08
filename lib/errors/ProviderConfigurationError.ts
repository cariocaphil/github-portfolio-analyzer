export class ProviderConfigurationError extends Error {
  constructor(
    message: string,
    public readonly providerName?: string,
  ) {
    super(message);
    this.name = "ProviderConfigurationError";
  }
}
