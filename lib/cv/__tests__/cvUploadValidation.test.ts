import { describe, expect, it } from "vitest";
import {
  CV_PDF_MIME_TYPE,
  MAX_CV_FILE_SIZE_BYTES,
  formatCvFileSize,
  validateCvFileSelection,
  validateCvUpload,
} from "@/lib/cv/cvUploadValidation";

function createPdfFile(name: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type: CV_PDF_MIME_TYPE });
}

describe("validateCvUpload", () => {
  it("accepts a valid PDF file", () => {
    const file = createPdfFile("philippe-dijon-cv.pdf", 123_456);
    const result = validateCvUpload(file);

    expect(result).toEqual({
      ok: true,
      success: true,
      filename: "philippe-dijon-cv.pdf",
      size: 123_456,
      mimeType: CV_PDF_MIME_TYPE,
    });
  });

  it("rejects a missing file", () => {
    const result = validateCvUpload(null);

    expect(result).toEqual({
      ok: false,
      success: false,
      error: "A CV PDF file is required.",
      status: 400,
    });
  });

  it("rejects a non-PDF file", () => {
    const file = new File(["hello"], "resume.txt", { type: "text/plain" });
    const result = validateCvUpload(file);

    expect(result).toEqual({
      ok: false,
      success: false,
      error: "Only PDF files are supported.",
      status: 400,
    });
  });

  it("rejects files larger than 5 MB", () => {
    const file = createPdfFile("large-cv.pdf", MAX_CV_FILE_SIZE_BYTES + 1);
    const result = validateCvUpload(file);

    expect(result).toEqual({
      ok: false,
      success: false,
      error: "CV file must be 5 MB or smaller.",
      status: 413,
    });
  });
});

describe("validateCvFileSelection", () => {
  it("returns null for a valid PDF", () => {
    const file = createPdfFile("cv.pdf", 1024);
    expect(validateCvFileSelection(file)).toBeNull();
  });

  it("returns an error when no file is selected", () => {
    expect(validateCvFileSelection(null)).toBe(
      "Select a PDF file before uploading.",
    );
  });
});

describe("formatCvFileSize", () => {
  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatCvFileSize(512)).toBe("512 B");
    expect(formatCvFileSize(2048)).toBe("2.0 KB");
    expect(formatCvFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});
