import type { AzureFailureDiagnostics } from "./azureErrorDiagnostics";

interface AnalysisLogEvent {
  event: string;
  provider?: string;
  model?: string;
  repositoryCount?: number;
  lensCount?: number;
  retryAttempt?: number;
  analysisDurationMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  statusCode?: number;
  azureErrorCode?: string;
  azureErrorMessage?: string;
  apiVersion?: string;
  requestType?: string;
  lensId?: string;
  strategy?: string;
  schemaName?: string;
  promptChars?: number;
  estimatedPromptTokens?: number;
}

export function logAnalysisEvent(data: AnalysisLogEvent): void {
  console.info(
    JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function logAzureFailure(
  data: AzureFailureDiagnostics & {
    deployment: string;
    apiVersion: string;
    requestType: string;
    lensId?: string;
    strategy: string;
  },
): void {
  logAnalysisEvent({
    event: "azure_request_failed",
    model: data.deployment,
    apiVersion: data.apiVersion,
    requestType: data.requestType,
    lensId: data.lensId,
    strategy: data.strategy,
    statusCode: data.statusCode,
    azureErrorCode: data.azureErrorCode,
    azureErrorMessage: data.azureErrorMessage,
  });
}
