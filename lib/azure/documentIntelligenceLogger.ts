interface DocumentIntelligenceLogEvent {
  event:
    | "document_analysis_started"
    | "document_analysis_completed"
    | "document_analysis_failed";
  blobName?: string;
  model?: string;
  pagesAnalyzed?: number;
  durationMs?: number;
  error?: string;
  azureErrorCode?: string;
  azureErrorMessage?: string;
  statusCode?: number;
  requestId?: string;
  stack?: string;
}

export function logDocumentIntelligenceEvent(
  data: DocumentIntelligenceLogEvent,
): void {
  const payload = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  if (data.event === "document_analysis_failed") {
    console.error(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}
