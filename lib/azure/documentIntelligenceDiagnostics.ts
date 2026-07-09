export interface DocumentIntelligenceFailureDetails {
  message: string;
  code?: string;
  statusCode?: number;
  requestId?: string;
  azureErrorCode?: string;
  azureErrorMessage?: string;
  stack?: string;
}

interface AzureRestErrorShape {
  message?: string;
  code?: string;
  statusCode?: number;
  stack?: string;
  details?: {
    error?: {
      code?: string;
      message?: string;
      innererror?: {
        code?: string;
        message?: string;
      };
    };
  };
  response?: {
    headers?: {
      get?: (name: string) => string | undefined;
    };
  };
}

function asRestError(error: unknown): AzureRestErrorShape | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  return error as AzureRestErrorShape;
}

export function extractDocumentIntelligenceFailure(
  error: unknown,
): DocumentIntelligenceFailureDetails {
  if (error instanceof Error) {
    const restError = asRestError(error);
    const azureError = restError?.details?.error;
    const innerError = azureError?.innererror;

    return {
      message: error.message,
      code: restError?.code,
      statusCode: restError?.statusCode,
      requestId:
        restError?.response?.headers?.get?.("x-ms-request-id") ??
        restError?.response?.headers?.get?.("apim-request-id"),
      azureErrorCode: innerError?.code ?? azureError?.code,
      azureErrorMessage: innerError?.message ?? azureError?.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

export function toPublicDocumentAnalysisMessage(
  details: DocumentIntelligenceFailureDetails,
): string {
  if (details.azureErrorCode === "ModelNotFound") {
    return "Azure Document Intelligence model is not available for this resource. Configure AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID (for example prebuilt-layout).";
  }

  if (details.azureErrorCode === "InvalidContent") {
    return "Azure Document Intelligence could not analyze the uploaded CV. The PDF may be corrupted or unsupported.";
  }

  if (details.statusCode === 401 || details.statusCode === 403) {
    return "Azure Document Intelligence authentication failed. Verify the endpoint and API key.";
  }

  return "Azure Document Intelligence could not analyze the uploaded CV.";
}
