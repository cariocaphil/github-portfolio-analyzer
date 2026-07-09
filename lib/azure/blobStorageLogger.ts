interface BlobStorageLogEvent {
  event: "blob_upload_started" | "blob_upload_completed" | "blob_upload_failed";
  blobName?: string;
  size?: number;
  durationMs?: number;
  error?: string;
}

export function logBlobStorageEvent(data: BlobStorageLogEvent): void {
  console.info(
    JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
    }),
  );
}
