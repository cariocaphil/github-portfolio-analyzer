import { NextResponse } from "next/server";
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

    // TODO V7.2: Upload validated CV PDF to Azure Blob Storage.
    await fileEntry.arrayBuffer();

    return NextResponse.json({
      success: true,
      filename: validation.filename,
      size: validation.size,
      mimeType: validation.mimeType,
    });
  } catch (error) {
    console.error("CV upload failed:", error);
    return NextResponse.json(
      { success: false, error: "CV upload failed." },
      { status: 500 },
    );
  }
}
