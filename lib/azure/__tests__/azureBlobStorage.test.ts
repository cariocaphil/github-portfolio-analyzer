import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const uploadData = vi.fn();
const createIfNotExists = vi.fn();
const getBlockBlobClient = vi.fn();
const getContainerClient = vi.fn();
const fromConnectionString = vi.fn();

vi.mock("@azure/storage-blob", () => ({
  BlobServiceClient: {
    fromConnectionString,
  },
}));

describe("azureBlobStorage", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();

    process.env.AZURE_STORAGE_ACCOUNT_NAME = "testaccount";
    process.env.AZURE_STORAGE_CONTAINER_NAME = "cvs";
    process.env.AZURE_STORAGE_CONNECTION_STRING =
      "DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net";

    getBlockBlobClient.mockReturnValue({
      url: "https://testaccount.blob.core.windows.net/cvs/2026-07-09/example-cv.pdf",
      uploadData,
      downloadToBuffer: vi.fn(),
      deleteIfExists: vi.fn(),
    });
    getContainerClient.mockReturnValue({
      createIfNotExists,
      getBlockBlobClient,
    });
    createIfNotExists.mockResolvedValue({ succeeded: true });
    fromConnectionString.mockReturnValue({
      getContainerClient,
    });
    uploadData.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    const { resetBlobStorageClientForTests } = await import("@/lib/azureBlobStorage");
    resetBlobStorageClientForTests();
    vi.unstubAllEnvs();
  });

  it("generates date-prefixed unique blob names", async () => {
    const { generateCvBlobName } = await import("@/lib/azureBlobStorage");
    const blobName = generateCvBlobName(new Date("2026-07-09T12:00:00.000Z"));

    expect(blobName).toMatch(/^2026-07-09\/[0-9a-f-]+-cv\.pdf$/);
  });

  it("uploads CV content with metadata", async () => {
    const { uploadCv } = await import("@/lib/azureBlobStorage");
    const content = Buffer.from("%PDF-1.4");

    const result = await uploadCv(content, "philippe-dijon-cv.pdf", {
      mimeType: "application/pdf",
      size: content.length,
    });

    expect(createIfNotExists).toHaveBeenCalled();
    expect(uploadData).toHaveBeenCalledWith(
      content,
      expect.objectContaining({
        blobHTTPHeaders: { blobContentType: "application/pdf" },
        metadata: expect.objectContaining({
          originalFilename: "philippe-dijon-cv.pdf",
          mimeType: "application/pdf",
          fileSize: String(content.length),
        }),
      }),
    );
    expect(result.filename).toBe("philippe-dijon-cv.pdf");
    expect(result.blobName).toMatch(/^\d{4}-\d{2}-\d{2}\/.+-cv\.pdf$/);
    expect(result.url).toContain("testaccount.blob.core.windows.net/cvs/");
  });

  it("throws BlobConfigurationError when storage env vars are missing", async () => {
    delete process.env.AZURE_STORAGE_CONNECTION_STRING;
    const { uploadCv, resetBlobStorageClientForTests } = await import(
      "@/lib/azureBlobStorage"
    );
    resetBlobStorageClientForTests();

    await expect(
      uploadCv(Buffer.from("pdf"), "cv.pdf", {
        mimeType: "application/pdf",
        size: 3,
      }),
    ).rejects.toMatchObject({ name: "BlobConfigurationError" });
  });

  it("wraps upload failures in BlobUploadError", async () => {
    uploadData.mockRejectedValueOnce(new Error("network failure"));
    const { uploadCv } = await import("@/lib/azureBlobStorage");

    await expect(
      uploadCv(Buffer.from("pdf"), "cv.pdf", {
        mimeType: "application/pdf",
        size: 3,
      }),
    ).rejects.toMatchObject({ name: "BlobUploadError" });
  });
});

describe("blobStorageConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("loads required Azure Blob Storage configuration", async () => {
    process.env.AZURE_STORAGE_ACCOUNT_NAME = "testaccount";
    process.env.AZURE_STORAGE_CONTAINER_NAME = "cvs";
    process.env.AZURE_STORAGE_CONNECTION_STRING = "UseDevelopmentStorage=true";

    const { loadBlobStorageConfig } = await import("@/lib/azure/blobStorageConfig");
    expect(loadBlobStorageConfig()).toEqual({
      accountName: "testaccount",
      containerName: "cvs",
      connectionString: "UseDevelopmentStorage=true",
    });
  });
});
