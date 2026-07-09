import type { CvUploadResponse, CvUploadSuccess } from "@/types/cv";

export class CvUploadRequestError extends Error {
  readonly status?: number;
  readonly stage?: string;

  constructor(message: string, status?: number, stage?: string) {
    super(message);
    this.name = "CvUploadRequestError";
    this.status = status;
    this.stage = stage;
  }
}

export async function uploadCv(file: File): Promise<CvUploadSuccess> {
  const formData = new FormData();
  formData.append("cv", file);

  const response = await fetch("/api/cv/upload", {
    method: "POST",
    body: formData,
  });

  let data: CvUploadResponse;

  try {
    data = (await response.json()) as CvUploadResponse;
  } catch {
    throw new CvUploadRequestError("CV upload failed.", response.status);
  }

  if (!data.success) {
    throw new CvUploadRequestError(data.error, response.status, data.stage);
  }

  if (!response.ok) {
    throw new CvUploadRequestError("CV upload failed.", response.status);
  }

  return data;
}
