import type { CvUploadResponse, CvUploadSuccess } from "@/types/cv";

export class CvUploadRequestError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CvUploadRequestError";
    this.status = status;
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
    throw new CvUploadRequestError(data.error, response.status);
  }

  if (!response.ok) {
    throw new CvUploadRequestError("CV upload failed.", response.status);
  }

  return data;
}
