import { randomUUID } from "node:crypto";
import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import { loadBlobStorageConfig } from "@/lib/azure/blobStorageConfig";
import {
  BlobConfigurationError,
  BlobUploadError,
} from "@/lib/azure/blobStorageErrors";
import { logBlobStorageEvent } from "@/lib/azure/blobStorageLogger";

export interface CvBlobUploadResult {
  blobName: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface CvBlobMetadata {
  mimeType: string;
  size: number;
}

type UploadContent = Buffer | Uint8Array;

let containerClient: ContainerClient | null = null;

function sanitizeMetadataValue(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, "").slice(0, 256);
}

export function generateCvBlobName(date = new Date()): string {
  const datePrefix = date.toISOString().slice(0, 10);
  return `${datePrefix}/${randomUUID()}-cv.pdf`;
}

function getContainerClient(): ContainerClient {
  try {
    const config = loadBlobStorageConfig();

    if (!containerClient) {
      const serviceClient = BlobServiceClient.fromConnectionString(
        config.connectionString,
      );
      containerClient = serviceClient.getContainerClient(config.containerName);
    }

    return containerClient;
  } catch (error) {
    if (error instanceof BlobConfigurationError) {
      throw error;
    }

    throw new BlobConfigurationError(
      "Azure Blob Storage is not configured correctly.",
    );
  }
}

async function ensureContainerExists(client: ContainerClient): Promise<void> {
  await client.createIfNotExists();
}

function toBuffer(content: UploadContent): Buffer {
  return Buffer.isBuffer(content) ? content : Buffer.from(content);
}

export async function uploadCv(
  file: UploadContent,
  filename: string,
  metadata: CvBlobMetadata,
): Promise<CvBlobUploadResult> {
  const blobName = generateCvBlobName();
  const content = toBuffer(file);
  const startedAt = Date.now();

  logBlobStorageEvent({
    event: "blob_upload_started",
    blobName,
    size: metadata.size,
  });

  try {
    const client = getContainerClient();
    await ensureContainerExists(client);

    const blockBlobClient = client.getBlockBlobClient(blobName);
    await blockBlobClient.uploadData(content, {
      blobHTTPHeaders: {
        blobContentType: metadata.mimeType,
      },
      metadata: {
        originalFilename: sanitizeMetadataValue(filename),
        uploadTimestamp: new Date().toISOString(),
        mimeType: metadata.mimeType,
        fileSize: String(metadata.size),
      },
    });

    const durationMs = Date.now() - startedAt;
    logBlobStorageEvent({
      event: "blob_upload_completed",
      blobName,
      size: metadata.size,
      durationMs,
    });

    return {
      blobName,
      url: blockBlobClient.url,
      filename,
      size: metadata.size,
      mimeType: metadata.mimeType,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message =
      error instanceof BlobConfigurationError || error instanceof BlobUploadError
        ? error.message
        : "CV upload to Azure Blob Storage failed.";

    logBlobStorageEvent({
      event: "blob_upload_failed",
      blobName,
      size: metadata.size,
      durationMs,
      error: message,
    });

    if (error instanceof BlobConfigurationError) {
      throw error;
    }

    throw new BlobUploadError(message, { cause: error });
  }
}

export async function getCv(blobName: string): Promise<Buffer> {
  try {
    const client = getContainerClient();
    const blockBlobClient = client.getBlockBlobClient(blobName);
    const download = await blockBlobClient.downloadToBuffer();

    return download;
  } catch (error) {
    if (error instanceof BlobConfigurationError) {
      throw error;
    }

    throw new BlobUploadError("Unable to retrieve CV from Azure Blob Storage.", {
      cause: error,
    });
  }
}

export async function deleteCv(blobName: string): Promise<void> {
  try {
    const client = getContainerClient();
    const blockBlobClient = client.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  } catch (error) {
    if (error instanceof BlobConfigurationError) {
      throw error;
    }

    throw new BlobUploadError("Unable to delete CV from Azure Blob Storage.", {
      cause: error,
    });
  }
}

export function resetBlobStorageClientForTests(): void {
  containerClient = null;
}
