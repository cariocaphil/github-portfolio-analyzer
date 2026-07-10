export class CvAlignmentError extends Error {
  readonly statusCode: number;

  constructor(
    message: string,
    options?: { cause?: unknown; statusCode?: number },
  ) {
    super(message, { cause: options?.cause });
    this.name = "CvAlignmentError";
    this.statusCode = options?.statusCode ?? 500;
  }
}
