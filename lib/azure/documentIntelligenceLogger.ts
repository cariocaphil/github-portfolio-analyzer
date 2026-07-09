interface DocumentIntelligenceLogEvent {
  event:
    | "document_analysis_started"
    | "document_analysis_completed"
    | "document_analysis_failed";
  blobName?: string;
  pagesAnalyzed?: number;
  durationMs?: number;
  error?: string;
}

export function logDocumentIntelligenceEvent(
  data: DocumentIntelligenceLogEvent,
): void {
  console.info(
    JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
    }),
  );
}
