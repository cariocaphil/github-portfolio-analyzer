import { describe, expect, it } from "vitest";
import {
  extractDocumentIntelligenceFailure,
  toPublicDocumentAnalysisMessage,
} from "@/lib/azure/documentIntelligenceDiagnostics";

describe("documentIntelligenceDiagnostics", () => {
  it("extracts Azure inner error details", () => {
    const error = Object.assign(new Error("Resource not found."), {
      code: "NotFound",
      statusCode: 404,
      details: {
        error: {
          code: "NotFound",
          message: "Resource not found.",
          innererror: {
            code: "ModelNotFound",
            message: "The requested model was not found.",
          },
        },
      },
      response: {
        headers: {
          get: (name: string) =>
            name === "x-ms-request-id" ? "req-123" : undefined,
        },
      },
    });

    expect(extractDocumentIntelligenceFailure(error)).toMatchObject({
      message: "Resource not found.",
      code: "NotFound",
      statusCode: 404,
      azureErrorCode: "ModelNotFound",
      requestId: "req-123",
    });
  });

  it("maps ModelNotFound to a public configuration message", () => {
    const message = toPublicDocumentAnalysisMessage({
      message: "Resource not found.",
      azureErrorCode: "ModelNotFound",
    });

    expect(message).toContain("AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID");
  });
});
