import { BlobConfigurationError } from "@/lib/azure/blobStorageErrors";

export interface BlobStorageConfig {
  accountName: string;
  containerName: string;
  connectionString: string;
}

export function loadBlobStorageConfig(): BlobStorageConfig {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim();
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME?.trim();
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();

  const missing: string[] = [];
  if (!accountName) missing.push("AZURE_STORAGE_ACCOUNT_NAME");
  if (!containerName) missing.push("AZURE_STORAGE_CONTAINER_NAME");
  if (!connectionString) missing.push("AZURE_STORAGE_CONNECTION_STRING");

  if (missing.length > 0) {
    throw new BlobConfigurationError(
      `Missing required Azure Blob Storage configuration: ${missing.join(", ")}.`,
    );
  }

  return {
    accountName: accountName!,
    containerName: containerName!,
    connectionString: connectionString!,
  };
}
