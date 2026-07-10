import { parseApiErrorMessage } from "@/lib/errors/apiErrorResponse";
import type { CvUploadResponse, CvUploadSuccess } from "@/types/cv";

export class CvUploadRequestError extends Error {
  readonly status?: number;
  readonly stage?: string;
  readonly title: string;

  constructor(
    message: string,
    status?: number,
    stage?: string,
    title = "File upload could not be completed",
  ) {
    super(message);
    this.name = "CvUploadRequestError";
    this.status = status;
    this.stage = stage;
    this.title = title;
  }
}

export async function uploadCv(file: File): Promise<CvUploadSuccess> {
  const formData = new FormData();
  formData.append("cv", file);

  const response = await fetch("/api/cv/upload", {
    method: "POST",
    body: formData,
  });

  let data: CvUploadResponse & {
    error?: string | { title?: string; message?: string };
  };

  try {
    data = (await response.json()) as CvUploadResponse & {
      error?: string | { title?: string; message?: string };
    };
  } catch {
    throw new CvUploadRequestError("CV upload failed.", response.status);
  }

  if (!data.success) {
    const parsed = parseApiErrorMessage(data, "CV upload failed.");
    throw new CvUploadRequestError(
      parsed.message,
      response.status,
      data.stage,
      parsed.title,
    );
  }

  if (!response.ok) {
    throw new CvUploadRequestError("CV upload failed.", response.status);
  }

  return data;
}
