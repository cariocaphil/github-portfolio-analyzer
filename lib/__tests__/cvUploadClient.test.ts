import { afterEach, describe, expect, it, vi } from "vitest";
import { CvUploadRequestError, uploadCv } from "@/lib/cvUploadClient";
import { CV_PDF_MIME_TYPE } from "@/lib/cv/cvUploadValidation";

describe("uploadCv", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns success payload for a valid upload", async () => {
    const file = new File(["pdf"], "philippe-dijon-cv.pdf", {
      type: CV_PDF_MIME_TYPE,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          filename: "philippe-dijon-cv.pdf",
          size: 3,
          mimeType: CV_PDF_MIME_TYPE,
        }),
      }),
    );

    await expect(uploadCv(file)).resolves.toEqual({
      success: true,
      filename: "philippe-dijon-cv.pdf",
      size: 3,
      mimeType: CV_PDF_MIME_TYPE,
    });
  });

  it("throws CvUploadRequestError for API validation failures", async () => {
    const file = new File(["pdf"], "cv.pdf", { type: CV_PDF_MIME_TYPE });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: "Only PDF files are supported.",
        }),
      }),
    );

    await expect(uploadCv(file)).rejects.toEqual(
      expect.objectContaining({
        name: "CvUploadRequestError",
        message: "Only PDF files are supported.",
        status: 400,
      }),
    );
  });

  it("throws CvUploadRequestError when response JSON is invalid", async () => {
    const file = new File(["pdf"], "cv.pdf", { type: CV_PDF_MIME_TYPE });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("invalid json");
        },
      }),
    );

    await expect(uploadCv(file)).rejects.toBeInstanceOf(CvUploadRequestError);
  });
});
