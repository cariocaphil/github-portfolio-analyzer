import { describe, expect, it } from "vitest";
import {
  detectUnsupportedParameter,
  extractAzureFailureDiagnostics,
} from "../azureErrorDiagnostics";

describe("azureErrorDiagnostics", () => {
  it("extracts status, code, and message from API errors", () => {
    const diagnostics = extractAzureFailureDiagnostics({
      status: 400,
      code: "unsupported_value",
      message: "Unsupported parameter: 'temperature' is not supported.",
    });

    expect(diagnostics.statusCode).toBe(400);
    expect(diagnostics.azureErrorCode).toBe("unsupported_value");
    expect(diagnostics.azureErrorMessage).toContain("temperature");
  });

  it("detects unsupported temperature parameter", () => {
    expect(
      detectUnsupportedParameter(
        new Error("Unsupported parameter: 'temperature' is not supported with this model."),
      ),
    ).toBe("temperature");
  });
});
