"use client";

import { useRef, useState } from "react";
import { CvUploadRequestError, uploadCv } from "@/lib/cvUploadClient";
import {
  CV_PDF_MIME_TYPE,
  formatCvFileSize,
  validateCvFileSelection,
} from "@/lib/cv/cvUploadValidation";

type UploadState = "idle" | "selected" | "uploading" | "success" | "error";

export function CvUploadSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setErrorMessage(null);
    setUploadState(file ? "selected" : "idle");
  }

  async function handleUpload() {
    const validationError = validateCvFileSelection(selectedFile);
    if (validationError || !selectedFile) {
      setErrorMessage(validationError ?? "Select a PDF file before uploading.");
      setUploadState("error");
      return;
    }

    setUploadState("uploading");
    setErrorMessage(null);

    try {
      await uploadCv(selectedFile);
      setUploadState("success");
    } catch (error) {
      const message =
        error instanceof CvUploadRequestError
          ? error.message
          : "CV upload failed.";
      setErrorMessage(message);
      setUploadState("error");
    }
  }

  const isUploading = uploadState === "uploading";
  const canUpload = Boolean(selectedFile) && !isUploading;

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">CV Cross-Check</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Upload a CV PDF to prepare a future comparison between stated experience
        and GitHub evidence.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          id="cv-file"
          type="file"
          accept={CV_PDF_MIME_TYPE}
          disabled={isUploading}
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!canUpload}
          className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Upload CV"}
        </button>
      </div>

      {selectedFile && (
        <p className="mt-3 text-sm text-slate-700">
          Selected:{" "}
          <span className="font-medium text-slate-900">{selectedFile.name}</span>
          <span className="text-slate-500">
            {" "}
            ({formatCvFileSize(selectedFile.size)})
          </span>
        </p>
      )}

      {uploadState === "success" && (
        <p
          role="status"
          className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          CV uploaded successfully. Comparison support will be added in a
          later version.
        </p>
      )}

      {uploadState === "error" && errorMessage && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </p>
      )}
    </section>
  );
}
