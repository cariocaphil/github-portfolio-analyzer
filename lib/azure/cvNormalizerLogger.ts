interface CvNormalizationLogEvent {
  event:
    | "cv_normalization_started"
    | "cv_normalization_completed"
    | "cv_normalization_failed";
  model?: string;
  blobName?: string;
  durationMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  error?: string;
}

export function logCvNormalizationEvent(data: CvNormalizationLogEvent): void {
  const payload = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  if (data.event === "cv_normalization_failed") {
    console.error(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}
