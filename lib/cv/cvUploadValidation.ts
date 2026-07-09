import type { CvUploadError, CvUploadSuccess } from "@/types/cv";

export const MAX_CV_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const CV_PDF_MIME_TYPE = "application/pdf";

export type CvUploadValidationResult =
  | ({ ok: true } & CvUploadSuccess)
  | ({ ok: false } & CvUploadError & { status: 400 | 413 });

export interface CvUploadFileLike {
  name: string;
  size: number;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export function isCvUploadFile(
  value: FormDataEntryValue | null,
): value is File {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CvUploadFileLike>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.size === "number" &&
    typeof candidate.type === "string" &&
    typeof candidate.arrayBuffer === "function"
  );
}

export function validateCvUpload(
  fileEntry: FormDataEntryValue | null,
): CvUploadValidationResult {
  if (!isCvUploadFile(fileEntry) || fileEntry.size === 0) {
    return {
      ok: false,
      success: false,
      error: "A CV PDF file is required.",
      status: 400,
    };
  }

  if (fileEntry.type !== CV_PDF_MIME_TYPE) {
    return {
      ok: false,
      success: false,
      error: "Only PDF files are supported.",
      status: 400,
    };
  }

  if (fileEntry.size > MAX_CV_FILE_SIZE_BYTES) {
    return {
      ok: false,
      success: false,
      error: "CV file must be 5 MB or smaller.",
      status: 413,
    };
  }

  return {
    ok: true,
    success: true,
    filename: fileEntry.name,
    size: fileEntry.size,
    mimeType: fileEntry.type,
  };
}

export function validateCvFileSelection(file: File | null): string | null {
  if (!file) {
    return "Select a PDF file before uploading.";
  }

  if (file.type !== CV_PDF_MIME_TYPE) {
    return "Only PDF files are supported.";
  }

  if (file.size > MAX_CV_FILE_SIZE_BYTES) {
    return "CV file must be 5 MB or smaller.";
  }

  return null;
}

export function formatCvFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
