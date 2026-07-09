export type CvUploadSuccess = {
  success: true;
  blobName: string;
  url: string;
  filename: string;
  size: number;
};

export type CvUploadError = {
  success: false;
  error: string;
};

export type CvUploadResponse = CvUploadSuccess | CvUploadError;
