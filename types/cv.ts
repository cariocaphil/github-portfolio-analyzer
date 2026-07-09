export type CvUploadSuccess = {
  success: true;
  filename: string;
  size: number;
  mimeType: string;
};

export type CvUploadError = {
  success: false;
  error: string;
};

export type CvUploadResponse = CvUploadSuccess | CvUploadError;
