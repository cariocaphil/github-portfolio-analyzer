interface CvAlignmentLogEvent {
  event:
    | "cv_alignment_started"
    | "cv_alignment_completed"
    | "cv_alignment_skipped"
    | "cv_alignment_failed";
  repositoryCount?: number;
  hasCvEvidence?: boolean;
  provider?: string;
  model?: string;
  reason?: string;
  error?: string;
  durationMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export function logCvAlignmentEvent(data: CvAlignmentLogEvent): void {
  const payload = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  if (data.event === "cv_alignment_failed") {
    console.error(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}
