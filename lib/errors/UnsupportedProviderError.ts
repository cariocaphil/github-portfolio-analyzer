export class UnsupportedProviderError extends Error {
  constructor(public readonly providerName: string) {
    super(
      `Unsupported portfolio analysis provider: "${providerName}". Supported values: mock, azure-openai.`,
    );
    this.name = "UnsupportedProviderError";
  }
}
