import { NextResponse } from "next/server";
import { analyzeCv } from "@/lib/azureDocumentIntelligence";
import { normalizeCvExtraction } from "@/lib/azureCvNormalizer";
import { uploadCv, type CvBlobUploadResult } from "@/lib/azureBlobStorage";
import {
  BlobConfigurationError,
  BlobUploadError,
} from "@/lib/azure/blobStorageErrors";
import {
  DocumentAnalysisError,
  DocumentAuthenticationError,
  DocumentConfigurationError,
} from "@/lib/azure/documentIntelligenceErrors";
import { ValidationError } from "@/lib/errors/application/types";
import {
  createApiErrorPayload,
  createApiErrorResponse,
} from "@/lib/errors/apiErrorResponse";
import { logApplicationError } from "@/lib/errors/logApplicationError";
import { normalizeApplicationError } from "@/lib/errors/normalizeApplicationError";
import { buildCandidateEvidenceSummary } from "@/lib/cv/buildCandidateEvidenceSummary";
import { buildCvExtractionSummary } from "@/lib/cv/buildCvExtractionSummary";
import {
  isCvUploadFile,
  validateCvUpload,
} from "@/lib/cv/cvUploadValidation";

function buildCvFailurePayload(
  uploadResult: CvBlobUploadResult | undefined,
  errorPayload: ReturnType<typeof createApiErrorPayload>,
  stage: string,
) {
  return {
    success: false as const,
    stage,
    ...errorPayload,
    blobName: uploadResult?.blobName,
    url: uploadResult?.url,
    filename: uploadResult?.filename,
    size: uploadResult?.size,
  };
}

export async function POST(request: Request) {
  let uploadResult: CvBlobUploadResult | undefined;

  try {
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return createApiErrorResponse(
        new ValidationError({
          title: "File upload could not be completed",
          userMessage: "A CV PDF file is required.",
        }),
      );
    }

    const fileEntry = formData.get("cv");
    const validation = validateCvUpload(fileEntry);

    if (!validation.ok) {
      return createApiErrorResponse(
        new ValidationError({
          title: "File upload could not be completed",
          userMessage: validation.error,
          httpStatus: validation.status,
        }),
      );
    }

    if (!isCvUploadFile(fileEntry)) {
      return createApiErrorResponse(
        new ValidationError({
          title: "File upload could not be completed",
          userMessage: "A CV PDF file is required.",
        }),
      );
    }

    const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
    uploadResult = await uploadCv(fileBuffer, validation.filename, {
      mimeType: validation.mimeType,
      size: validation.size,
    });

    const analysisResult = await analyzeCv(fileBuffer, {
      blobName: uploadResult.blobName,
    });

    const rawExtraction = analysisResult.candidateCv;
    let candidateEvidence = null;
    let normalizationError: string | undefined;

    try {
      const normalizationResult = await normalizeCvExtraction({
        rawExtraction,
        metadata: {
          filename: uploadResult.filename,
          blobName: uploadResult.blobName,
          pagesAnalyzed: analysisResult.pagesAnalyzed,
          documentModelId: analysisResult.modelId,
        },
      });
      candidateEvidence = normalizationResult.candidateEvidence;
    } catch {
      normalizationError =
        "CV normalization is temporarily unavailable. Portfolio analysis will continue without CV alignment.";
    }

    return NextResponse.json({
      success: true,
      blobName: uploadResult.blobName,
      url: uploadResult.url,
      filename: uploadResult.filename,
      size: uploadResult.size,
      rawExtraction,
      candidateEvidence,
      normalizationError,
      cv: candidateEvidence
        ? buildCandidateEvidenceSummary(candidateEvidence)
        : buildCvExtractionSummary(rawExtraction),
    });
  } catch (error) {
    const applicationError = normalizeApplicationError(error);
    logApplicationError(applicationError, {
      route: "/api/cv/upload",
      operation: "cv_upload",
    });

    const stage =
      error instanceof BlobConfigurationError ||
      error instanceof BlobUploadError
        ? "blob-storage"
        : error instanceof DocumentConfigurationError ||
            error instanceof DocumentAnalysisError ||
            error instanceof DocumentAuthenticationError
          ? "document-analysis"
          : "upload";

    return NextResponse.json(
      buildCvFailurePayload(
        uploadResult,
        createApiErrorPayload(applicationError),
        stage,
      ),
      { status: applicationError.httpStatus },
    );
  }
}
