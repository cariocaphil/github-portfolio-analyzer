import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pollUntilDone = vi.fn();
const beginAnalyzeDocument = vi.fn();
const beginAnalyzeDocumentFromUrl = vi.fn();

vi.mock("@azure/ai-form-recognizer", () => ({
  AzureKeyCredential: vi.fn(),
  DocumentAnalysisClient: vi.fn().mockImplementation(() => ({
    beginAnalyzeDocument,
    beginAnalyzeDocumentFromUrl,
  })),
}));

describe("azureDocumentIntelligence", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();

    process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT =
      "https://test.cognitiveservices.azure.com";
    process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY = "test-key";

    beginAnalyzeDocument.mockResolvedValue({ pollUntilDone });
    beginAnalyzeDocumentFromUrl.mockResolvedValue({ pollUntilDone });
    pollUntilDone.mockResolvedValue({
      apiVersion: "2024-11-30",
      modelId: "prebuilt-layout",
      content: "Jane Doe\njane@example.com\n\nSkills\nTypeScript",
      pages: [{ pageNumber: 1 }],
      documents: [
        {
          docType: "resume",
          confidence: 0.9,
          spans: [],
          fields: {
            CandidateName: { kind: "string", value: "Jane Doe" },
            Skills: {
              kind: "array",
              values: [{ kind: "string", value: "TypeScript" }],
            },
          },
        },
      ],
    });
  });

  afterEach(async () => {
    const { resetDocumentIntelligenceClientForTests } = await import(
      "@/lib/azureDocumentIntelligence"
    );
    resetDocumentIntelligenceClientForTests();
    vi.unstubAllEnvs();
  });

  it("analyzes CV content from a buffer using the configured model", async () => {
    const { analyzeCv } = await import("@/lib/azureDocumentIntelligence");
    const result = await analyzeCv(Buffer.from("%PDF"), {
      blobName: "2026-07-09/test-cv.pdf",
    });

    expect(beginAnalyzeDocument).toHaveBeenCalledWith(
      "prebuilt-layout",
      expect.any(Buffer),
    );
    expect(result.pagesAnalyzed).toBe(1);
    expect(result.modelId).toBe("prebuilt-layout");
    expect(result.candidateCv.personalInformation.fullName).toBe("Jane Doe");
    expect(result.candidateCv.skills).toEqual(["TypeScript"]);
  });

  it("analyzes CV content from a blob URL", async () => {
    const { analyzeCvFromBlob } = await import("@/lib/azureDocumentIntelligence");
    await analyzeCvFromBlob("https://example.blob.core.windows.net/cv.pdf", {
      blobName: "cv.pdf",
    });

    expect(beginAnalyzeDocumentFromUrl).toHaveBeenCalledWith(
      "prebuilt-layout",
      "https://example.blob.core.windows.net/cv.pdf",
    );
  });

  it("throws DocumentConfigurationError when env vars are missing", async () => {
    delete process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
    const { analyzeCv, resetDocumentIntelligenceClientForTests } = await import(
      "@/lib/azureDocumentIntelligence"
    );
    resetDocumentIntelligenceClientForTests();

    await expect(analyzeCv(Buffer.from("pdf"))).rejects.toMatchObject({
      name: "DocumentConfigurationError",
    });
  });

  it("maps Azure ModelNotFound to DocumentAnalysisError with diagnostics", async () => {
    beginAnalyzeDocument.mockRejectedValueOnce(
      Object.assign(new Error("Resource not found."), {
        code: "NotFound",
        statusCode: 404,
        details: {
          error: {
            innererror: {
              code: "ModelNotFound",
              message: "The requested model was not found.",
            },
          },
        },
      }),
    );

    const { analyzeCv } = await import("@/lib/azureDocumentIntelligence");

    await expect(analyzeCv(Buffer.from("pdf"))).rejects.toMatchObject({
      name: "DocumentAnalysisError",
      azureErrorCode: "ModelNotFound",
      statusCode: 404,
    });
  });
});
