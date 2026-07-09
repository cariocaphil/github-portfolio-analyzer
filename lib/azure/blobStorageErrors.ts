export class BlobConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlobConfigurationError";
  }
}

export class BlobUploadError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "BlobUploadError";
  }
}
