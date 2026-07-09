import { NextResponse } from "next/server";
import { uploadCv } from "@/lib/azureBlobStorage";
import {
  BlobConfigurationError,
  BlobUploadError,
} from "@/lib/azure/blobStorageErrors";
import {
  isCvUploadFile,
  validateCvUpload,
} from "@/lib/cv/cvUploadValidation";

export async function POST(request: Request) {
  try {
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: "A CV PDF file is required." },
        { status: 400 },
      );
    }

    const fileEntry = formData.get("cv");
    const validation = validateCvUpload(fileEntry);

    if (!validation.ok) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: validation.status },
      );
    }

    if (!isCvUploadFile(fileEntry)) {
      return NextResponse.json(
        { success: false, error: "A CV PDF file is required." },
        { status: 400 },
      );
    }

    const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
    const uploadResult = await uploadCv(fileBuffer, validation.filename, {
      mimeType: validation.mimeType,
      size: validation.size,
    });

    // TODO V7.3:
    // Trigger Azure AI Document Intelligence
    // to extract structured CV data.

    return NextResponse.json({
      success: true,
      blobName: uploadResult.blobName,
      url: uploadResult.url,
      filename: uploadResult.filename,
      size: uploadResult.size,
    });
  } catch (error) {
    if (error instanceof BlobConfigurationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 503 },
      );
    }

    if (error instanceof BlobUploadError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    console.error("CV upload failed:", error);
    return NextResponse.json(
      { success: false, error: "CV upload failed." },
      { status: 500 },
    );
  }
}
