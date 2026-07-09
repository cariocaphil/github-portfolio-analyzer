import { NextResponse } from "next/server";
import { analyzeCv } from "@/lib/azureDocumentIntelligence";
import { uploadCv } from "@/lib/azureBlobStorage";
import {
  BlobConfigurationError,
  BlobUploadError,
} from "@/lib/azure/blobStorageErrors";
import { buildCvExtractionSummary } from "@/lib/cv/buildCvExtractionSummary";
import {
  DocumentAnalysisError,
  DocumentConfigurationError,
} from "@/lib/azure/documentIntelligenceErrors";
import {
  isCvUploadFile,
  validateCvUpload,
} from "@/lib/cv/cvUploadValidation";

export async function POST(request: Request) {
  let uploadedBlobName: string | undefined;

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
    uploadedBlobName = uploadResult.blobName;

    const analysisResult = await analyzeCv(fileBuffer, {
      blobName: uploadResult.blobName,
    });

    // TODO V7.4:
    // Compare extracted CandidateCv against GitHub portfolio evidence.

    const extractedCv = analysisResult.candidateCv;

    return NextResponse.json({
      success: true,
      blobName: uploadResult.blobName,
      url: uploadResult.url,
      filename: uploadResult.filename,
      size: uploadResult.size,
      cv: buildCvExtractionSummary(extractedCv),
      extractedCv,
    });
  } catch (error) {
    if (error instanceof BlobConfigurationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 503 },
      );
    }

    if (error instanceof DocumentConfigurationError) {
      return NextResponse.json(
        { success: false, error: error.message, blobName: uploadedBlobName },
        { status: 503 },
      );
    }

    if (error instanceof BlobUploadError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    if (error instanceof DocumentAnalysisError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          blobName: uploadedBlobName,
        },
        { status: 502 },
      );
    }

    console.error("CV upload failed:", error);
    return NextResponse.json(
      { success: false, error: "CV upload failed.", blobName: uploadedBlobName },
      { status: 500 },
    );
  }
}
