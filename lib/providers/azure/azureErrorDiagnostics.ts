export interface AzureFailureDiagnostics {
  statusCode?: number;
  azureErrorCode?: string;
  azureErrorMessage?: string;
  deployment?: string;
  apiVersion?: string;
  requestType?: string;
  lensId?: string;
  strategy?: string;
}

export function extractAzureFailureDiagnostics(
  error: unknown,
): AzureFailureDiagnostics {
  const diagnostics: AzureFailureDiagnostics = {};

  if (error && typeof error === "object") {
    const apiError = error as {
      status?: number;
      code?: string | null;
      message?: string;
      param?: string | null;
      error?: { code?: string; message?: string };
    };

    diagnostics.statusCode = apiError.status;
    diagnostics.azureErrorCode =
      apiError.code ?? apiError.error?.code ?? apiError.param ?? undefined;
    diagnostics.azureErrorMessage =
      apiError.message ?? apiError.error?.message ?? undefined;
  } else if (error instanceof Error) {
    diagnostics.azureErrorMessage = error.message;
  }

  return diagnostics;
}

export type UnsupportedAzureParameter =
  | "temperature"
  | "top_p"
  | "response_format"
  | "json_schema";

export function detectUnsupportedParameter(
  error: unknown,
): UnsupportedAzureParameter | null {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes("temperature")) {
    return "temperature";
  }
  if (message.includes("top_p") || message.includes("top p")) {
    return "top_p";
  }
  if (
    message.includes("json_schema") ||
    message.includes("structured output") ||
    message.includes("text.format")
  ) {
    return "json_schema";
  }
  if (message.includes("response_format")) {
    return "response_format";
  }

  const param = (error as { param?: string | null })?.param?.toLowerCase();
  if (param === "temperature") return "temperature";
  if (param === "top_p") return "top_p";
  if (param === "response_format") return "response_format";

  return null;
}

export function isResponsesApiUnsupported(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("/responses") ||
    message.includes("responses api") ||
    message.includes("unknown url") ||
    message.includes("not found") ||
    message.includes("invalid url")
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return String(error ?? "");
}
