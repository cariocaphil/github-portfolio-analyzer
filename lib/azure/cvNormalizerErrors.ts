export class CvNormalizationError extends Error {
  readonly statusCode?: number;

  constructor(message: string, options?: { cause?: unknown; statusCode?: number }) {
    super(message, options);
    this.name = "CvNormalizationError";
    this.statusCode = options?.statusCode ?? 502;
  }
}
